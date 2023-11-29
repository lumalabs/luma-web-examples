import GUI from 'lil-gui';
import { LumaSplatsLoader, LumaSplatsThree } from "luma-web";
import { ACESFilmicToneMapping, BoxGeometry, Camera, CineonToneMapping, DoubleSide, FogExp2, Mesh, MeshNormalMaterial, NoToneMapping, Scene, Uniform, WebGLRenderer } from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { downloadArtifacts } from "./util/DownloadArtifacts";

export function DemoCustomShaders(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {
	let needsRender = true;

	renderer.xr.enabled = true;
	renderer.toneMapping = ACESFilmicToneMapping;

	gui.add(renderer, 'toneMapping', {
		NoToneMapping,
		CineonToneMapping,
		ACESFilmicToneMapping,
	});
	// tone mapping exposure
	gui.add(renderer, 'toneMappingExposure', 0, 10);

	let vrButton = VRButton.createButton(renderer);
	let canvas = renderer.getContext().canvas as HTMLCanvasElement;
	canvas.parentElement!.append(vrButton);

	// normal cube
	let cube = new Mesh(
		new BoxGeometry(1, 1, 1),
		new MeshNormalMaterial({
			wireframe: false,
			side: DoubleSide,
		})
	);
	// scene.add(cube);
	cube.scale.set(0.5, 0.5, 0.5);

	let params = new URLSearchParams(document.location.search)

	let uuid = params.get('uuid');
	let src = params.get('src');
	let url = params.get('url');
	let artifactsStr = params.get('artifacts');
	let artifacts: object | null = artifactsStr ? JSON.parse(artifactsStr) : null;

	// if nothing provided use an example uuid 218530bb-d6cc-4984-b5d5-3bfab719a94b
	if (!uuid && !src && !url && !artifacts) {
		uuid = '218530bb-d6cc-4984-b5d5-3bfab719a94b';
	}

	let uniformTime = new Uniform(0);

	let splatLoader = new LumaSplatsLoader({ captureUrl: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c' });
	let splats = new LumaSplatsThree({
		loader: splatLoader,
		particleRevealEnabled: false,
		enableThreeShaderIntegration: true,
		onRequestRender: () => {
			needsRender = true;
		},
		onBeforeRender: () => {
			uniformTime.value = performance.now() / 1000;
		}
	});
	scene.add(splats);

	gui.add(splats, 'enableThreeShaderIntegration').name("Use Three Pipeline");
	
	splats.setShaderHooks({
		vertexShaderHooks: {
			additionalUniforms: {
				time_s: ['float', uniformTime],
			},
		
			// additionalGlobals: /*glsl*/``,

			// onMainEnd: /*glsl*/`
			// 	(vec4 p) {
			// 		return p;
			// 	}
			// `,

			// returns a mat4
			getSplatTransform: /*glsl*/`
				(vec3 position, uint layersBitmask) {
					// sin wave on x-axis
					float x = 0.;
					float z = 0.;
					float y = sin(position.x * 1.0 + time_s) * 0.1;
					return mat4(
						1., 0., 0., 0,
						0., 1., 0., 0,
						0., 0., 1., 0,
						x,  y,  z, 1.
					);
				}
			`,
			
			// getSplatColor: `
			// 	(vec4 rgba, vec3 position, uint layersBitmask) {
			// 		return rgba * vec4(abs(normalize(position)), 1.0);
			// 	}
			// `
		}
	});

	splats.onInitialCameraTransform = transform => {
		camera.matrix.copy(transform);
		camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.updateMatrixWorld();
	};


	let layersEnabled = {
		background: true,
		foreground: true,
	}

	function updateSemanticMask() {
		needsRender = true;
		splats.semanticsMask =
			(layersEnabled.background ? 1 : 0) |
			(layersEnabled.foreground ? 2 : 0);
	}

	updateSemanticMask();

	let layersFolder = gui.addFolder('layers');

	layersFolder.add(layersEnabled, 'background').onChange(updateSemanticMask);
	layersFolder.add(layersEnabled, 'foreground').onChange(updateSemanticMask);
	layersFolder.hide();

	splatLoader.semanticsReady.then(value => {
		if (value != null) {
			layersFolder.show();
		}
	});

	// fog
	scene.fog = new FogExp2(0xEEEEEE, 0.05);
	scene.background = scene.fog.color;

	// gui for fog
	gui.add(scene.fog, 'density', 0, 0.3).name('fog density');
	gui.addColor(scene.fog, 'color').name('fog color');

	gui.add({downloadArtifacts: () => downloadArtifacts(splatLoader)}, 'downloadArtifacts');

	return {
		dispose: () => {
			splats.dispose();
			vrButton.remove();
		}
	}
}