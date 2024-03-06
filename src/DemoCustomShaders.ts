import { LumaSplatsLoader, LumaSplatsThree } from "@lumaai/luma-web";
import { FogExp2, Uniform } from "three";
import { DemoProps } from '.';
import { downloadArtifacts } from "./util/DownloadArtifacts";

export function DemoCustomShaders(props: DemoProps) {
	let { renderer, camera, scene, gui } = props;

	let uniformTime = new Uniform(0);

	let splats = new LumaSplatsThree({
		// Chateau de Menthon - Annecy @Yannick_Cerrutti
		source: `https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c`,
		enableThreeShaderIntegration: true,
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
		splats.semanticsMask =
			(layersEnabled.background ? 1 : 0) |
			(layersEnabled.foreground ? 2 : 0);
	}

	updateSemanticMask();

	let layersFolder = gui.addFolder('layers');

	layersFolder.add(layersEnabled, 'background').onChange(updateSemanticMask);
	layersFolder.add(layersEnabled, 'foreground').onChange(updateSemanticMask);
	layersFolder.hide();

	// fog
	scene.fog = new FogExp2(0xEEEEEE, 0.05);
	scene.background = scene.fog.color;

	// gui for fog
	gui.add(scene.fog, 'density', 0, 0.3).name('fog density');
	gui.addColor(scene.fog, 'color').name('fog color');

	return {
		dispose: () => {
			splats.dispose();
		}
	}
}