import GUI from "lil-gui";
import { LumaSplatsThree } from "luma-web";
import { Camera, Mesh, Scene, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EnvironmentProbes } from "./util/EnvironmentProbes";

export function DemoLighting(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {
	let splats = new LumaSplatsThree({
		source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		// source: 'https://lumalabs.ai/capture/b5faf515-7932-4000-ab23-959fc43f0d94',
		// disable loading animation so model is fully rendered after onLoad
		loadingAnimationEnabled: false,
	});

	splats.onLoad = (s) => {
		let capturedTexture = splats.captureCubeMap(renderer);
		scene.environment = capturedTexture;
		scene.background = capturedTexture;
		scene.backgroundBlurriness = 0.5;
	}

	scene.add(splats);

	// move camera to ideal viewing position
	splats.onInitialCameraTransform = transform => {
		camera.matrix.copy(transform);
		camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.position.y = 0.25;
	};

	// load ufo glb
	let loader = new GLTFLoader();

	/**
	 * UFO_B11 D Model by Zuncho Multimedia is licensed under Creative Commons Attribution
	 * https://sketchfab.com/3d-models/ufo-b11-d-model-75cc3cf1fbb648e5b5a046c055df017a#download
	 */
	loader.load('assets/models/ufo_b11_d_model.glb', (gltf) => {
		let ufo = gltf.scene;
		ufo.scale.setScalar((1/100) * 0.8);
		ufo.scale.y *= 0.75;
		ufo.position.y = 0.5;
		ufo.position.x = -0.8;
		scene.add(ufo);

		// make shiny metal
		ufo.traverse((child) => {
			if (child instanceof Mesh) {
				child.material.metalness = 1.0;
				child.material.roughness = 0.0;
			}
		});

		scene.onBeforeRender = () => {
			let t_s = performance.now() / 1000;
			ufo.rotation.y = (t_s * 0.1) % (Math.PI * 2);
			ufo.position.y = Math.sin(t_s * 0.25) * 0.05 + 0.5;
		}
	});

	let probes = new EnvironmentProbes();
	probes.position.x = 2.5;
	scene.add(probes);

	return {
		dispose: () => splats.dispose()
	}
}