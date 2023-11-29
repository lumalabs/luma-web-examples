import GUI from "lil-gui";
import { LumaSplatsSemantics, LumaSplatsThree } from "luma-web";
import { Camera, Scene, WebGLRenderer } from "three";
import { loadEnvironment } from "./util/Environment";

export function DemoBackgroundRemoval(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {

	let splats = new LumaSplatsThree({
		// Jules Desbois La Femme à l’arc @HouseofJJD
		source: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
		enableThreeShaderIntegration: false,
	});

	scene.add(splats);
	
	let layersEnabled = {
		Background: false,
		Foreground: true,
	}

	function updateSemanticMask() {
		splats.semanticsMask =
			(layersEnabled.Background ? LumaSplatsSemantics.BACKGROUND : 0) |
			(layersEnabled.Foreground ? LumaSplatsSemantics.FOREGROUND : 0);
	}

	updateSemanticMask();

	gui.add(layersEnabled, 'Background').onChange(updateSemanticMask);

	loadEnvironment(renderer, scene, 'assets/venice_sunset_1k.hdr');

	return {
		dispose: () => {
			splats.dispose();
		}
	}
}