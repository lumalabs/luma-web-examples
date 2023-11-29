import GUI from "lil-gui";
import { LumaSplatsThree } from "luma-web";
import { AdditiveBlending, Camera, CustomBlending, FrontSide, Mesh, MeshPhysicalMaterial, MultiplyBlending, NoBlending, NoColorSpace, NormalBlending, Plane, SRGBColorSpace, Scene, SphereGeometry, SubtractiveBlending, Vector3, WebGLRenderer } from "three";

export function DemoTransmission(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {

	renderer.localClippingEnabled = true;

	let globeSplats = new LumaSplatsThree({
		// source: 'assets/data/bike',
		// source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		// source: 'https://lumalabs.ai/capture/0b4de2ed-1621-4954-900f-0a94220071f2',
		source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
		enableThreeShaderIntegration: true,
		onBeforeRender: (renderer) => {
			// disable MSAA on render targets (in this case the transmission render target)
			let target = renderer.getRenderTarget();
			if (target) {
				target.samples = 0;
			}
			// only render in targets and not the canvas
			globeSplats.preventDraw = target == null;
		}
	});
	globeSplats.material.clipping = false;
	globeSplats.material.transparent = false;
	scene.add(globeSplats);

	let environmentSplats = new LumaSplatsThree({
		source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		// source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
		// source: 'https://lumalabs.ai/capture/0b4de2ed-1621-4954-900f-0a94220071f2',
		// source: 'https://lumalabs.ai/capture/d913de89-45ac-40ba-a29e-19b847932b8f',
		// source: 'https://lumalabs.ai/capture/0c2354fd-8e6a-402e-9c3c-40b3890b74b5',
		// source: 'https://lumalabs.ai/capture/d2d2badd-8bdd-4874-84f7-9df2aae27f29', // city
		// source: {uuid: '7e6c2f5c-0950-4fc8-b6c5-a7e4019bae01'},
		loadingAnimationEnabled: false,
		enableThreeShaderIntegration: false,
	});
	scene.add(environmentSplats);

	// the splats file can provide an ideal initial viewing location
    environmentSplats.onInitialCameraTransform = transform => {
        camera.matrix.copy(transform);
        camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.position.y = 0.6;
		camera.position.setLength(4);
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

	let glassSphere = new Mesh(
		new SphereGeometry(1, 32, 32),
		new MeshPhysicalMaterial({
			roughness: 0,
			metalness: 0,
			transparent: true,
			transmission: 1,
			thickness: 1.52,
			clearcoat: 1,
			side: FrontSide,
		})
	);
	addMaterial(gui, glassSphere.material as MeshPhysicalMaterial, 'Glass');
	scene.add(glassSphere);

	// loadEnvironment(renderer, scene, 'assets/venice_sunset_1k.hdr');
	environmentSplats.onLoad = () => {
		let capturedTexture = environmentSplats.captureCubeMap(renderer);
		scene.environment = capturedTexture;
		scene.background = capturedTexture;
		scene.backgroundBlurriness = 0.5;
	}

	return {
		dispose: () => globeSplats.dispose(),
	}
}

function addMaterial(gui: GUI, material: MeshPhysicalMaterial, name: string) {
	let materialFolder = gui.addFolder(name);
	materialFolder.addColor(material, 'color');
	materialFolder.add(material, 'flatShading');
	materialFolder.add(material, 'depthWrite');
	materialFolder.add(material, 'depthTest');
	materialFolder.add(material, 'transparent');
	materialFolder.add(material, 'blending', {
		NoBlending,
		NormalBlending,
		AdditiveBlending,
		SubtractiveBlending,
		MultiplyBlending,
		CustomBlending,
	});
	materialFolder.add(material, 'premultipliedAlpha');
	materialFolder.add(material, 'opacity', 0, 1);
	materialFolder.add(material, 'metalness', 0, 1);
	materialFolder.add(material, 'roughness', 0, 1);
	materialFolder.add(material, 'emissiveIntensity', 0, 4);
	materialFolder.add(material, 'iridescence', 0, 1);
	materialFolder.add(material, 'iridescenceIOR', 0, 3);
	let iridescenceThicknessRange = { min: 0, max: 1  };
	materialFolder.add(iridescenceThicknessRange, 'min', 0, 1).onChange(() => {
		material.iridescenceThicknessRange = [iridescenceThicknessRange.min, iridescenceThicknessRange.max];
	});
	materialFolder.add(iridescenceThicknessRange, 'max', 0, 1).onChange(() => {
		material.iridescenceThicknessRange = [iridescenceThicknessRange.min, iridescenceThicknessRange.max];
	});
	materialFolder.add(material, 'envMapIntensity', 0, 4);

	// transmission
	materialFolder.add(material, 'transmission', 0, 1);
	materialFolder.add(material, 'ior', 0, 3);
	materialFolder.add(material, 'thickness', 0, 10);

	// clearcoat
	materialFolder.add(material, 'clearcoat', 0, 1);
	materialFolder.add(material, 'clearcoatRoughness', 0, 1);
	materialFolder.add(material, 'reflectivity', 0, 1);

	return materialFolder;
}