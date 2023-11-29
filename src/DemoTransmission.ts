import GUI from "lil-gui";
import { LumaSplatsThree } from "luma-web";
import { AdditiveBlending, Camera, CustomBlending, FrontSide, Mesh, MeshPhysicalMaterial, MultiplyBlending, NoBlending, NormalBlending, Plane, Scene, SphereGeometry, SubtractiveBlending, Vector3, WebGLRenderer } from "three";

export function DemoTransmission(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {

	renderer.localClippingEnabled = true;

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

			// only render in targets and not the canvas
			globeSplats.preventDraw = target == null;
		}
	});
	globeSplats.material.clipping = false;
	// disable transparency so the renderer considers it an opaque object
	// opaque objects are rendered in the transmission pass (whereas transparent objects are not)
	globeSplats.material.transparent = false;
	scene.add(globeSplats);

	let environmentSplats = new LumaSplatsThree({
		// Arosa Hörnli - Switzerland @splnlss
		source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		loadingAnimationEnabled: false,
		enableThreeShaderIntegration: false,
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

	// add a refractive transmissive sphere
	let glassSphere = new Mesh(
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

	scene.add(glassSphere);

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