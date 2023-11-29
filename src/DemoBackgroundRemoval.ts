import GUI from "lil-gui";
import { LumaSplatsSemantics, LumaSplatsThree } from "luma-web";
import { Camera, PMREMGenerator, Scene, Texture, WebGLRenderer } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { loadEnvironment } from "./util/Environment";

export function DemoBackgroundRemoval(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {
	let splats = new LumaSplatsThree({
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