import { LumaSplatsThree } from "@lumaai/luma-web";
import GUI from "lil-gui";
import { Camera, MathUtils, PerspectiveCamera, FrontSide, Mesh, MeshPhysicalMaterial, Plane, Scene, SphereGeometry, Vector3, WebGLRenderer } from "three";

export function DemoTransmission(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {

	renderer.localClippingEnabled = false;

	// add a refractive transmissive sphere
	let glassGlobe = new Mesh(
		new SphereGeometry(1, 32, 32),
		new MeshPhysicalMaterial({
			roughness: 0,
			metalness: 0,
			transparent: true,
			transmission: 1,
			ior: 1.341,
			thickness: 1.52,
			envMapIntensity: 1.2, // push up the environment map intensity a little
			clearcoat: 1,
			side: FrontSide,
		})
	);
	const glassSphereRadius = 1;
	const initialMaterialProperties = glassGlobe.material.clone();
	glassGlobe.scale.setScalar(glassSphereRadius);
	scene.add(glassGlobe);

	let globeSurfaceDistance = NaN;
	scene.onBeforeRender = () => {
		// check if camera's near plane is inside the globe
		camera.updateWorldMatrix(true, false);
		let nearVector = new Vector3(0, 0, -(camera as PerspectiveCamera).near);
		let nearWorld = nearVector.applyMatrix4(camera.matrixWorld);
		let distanceToGlobe = nearWorld.distanceTo(glassGlobe.position);
		globeSurfaceDistance = distanceToGlobe - glassSphereRadius;

		// adjust globe thickness
		glassGlobe.material.thickness = MathUtils.lerp(initialMaterialProperties.thickness, 0, MathUtils.smoothstep(0.2, 0, globeSurfaceDistance));
		glassGlobe.visible = globeSurfaceDistance > 0;
	}

	let globeSplatClippingPlane = new Plane(new Vector3(0, 0, 1), 0);
	let globeSplats = new LumaSplatsThree({
		// Chateau de Menthon - Annecy @Yannick_Cerrutti 
		source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
		enableThreeShaderIntegration: true,
		onBeforeRender: (renderer) => {
			// disable MSAA on render targets (in this case the transmission render target)
			// this improves splatting performance
			let target = renderer.getRenderTarget();
			if (target) {
				target.samples = 0;
			}
			
			let isInsideGlobe = globeSurfaceDistance < 0;

			// only render in targets and not the canvas
			globeSplats.preventDraw = isInsideGlobe ? (target != null) : (target == null)
		}
	});
	globeSplats.material.clipping = false;
	globeSplats.material.clippingPlanes = [globeSplatClippingPlane];
	// disable transparency so the renderer considers it an opaque object
	// opaque objects are rendered in the transmission pass (whereas transparent objects are not)
	globeSplats.material.transparent = false;
	scene.add(globeSplats);

	let environmentSplats = new LumaSplatsThree({
		// Arosa Hörnli - Switzerland @splnlss
		source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		loadingAnimationEnabled: false,
		enableThreeShaderIntegration: false,
		onBeforeRender: () => {
			let isInsideGlobe = globeSurfaceDistance < 0;

			environmentSplats.preventDraw = isInsideGlobe;
		}
	});
	scene.add(environmentSplats);

	// the splats file can provide an ideal initial viewing location
    environmentSplats.onInitialCameraTransform = transform => {
        camera.matrix.copy(transform);
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

		// adjust camera position
		camera.position.y = 0.6;
		camera.position.setLength(3.3);
    };

	const unitCubePlanes = [
		new Plane(new Vector3(0,  0, -1), 1.5),
		new Plane(new Vector3(1,  0,  0), 1.5),
		new Plane(new Vector3(0, -1,  0), 1.5),
		new Plane(new Vector3(0,  1,  0), 1.5),
		new Plane(new Vector3(-1, 0,  0), 1.5),
		new Plane(new Vector3(0,  0,  1), 1.5),
	];

	// globeSplats.material.clippingPlanes = unitCubePlanes;

	// capture environment lighting
	environmentSplats.onLoad = () => {
		let capturedTexture = environmentSplats.captureCubeMap(renderer);
		scene.environment = capturedTexture;
		scene.background = capturedTexture;
		scene.backgroundBlurriness = 0.5;
	}

	return {
		dispose: () => {
			globeSplats.dispose();
			environmentSplats.dispose();
		}
	}
}