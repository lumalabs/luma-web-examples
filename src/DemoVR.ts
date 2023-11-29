import GUI from "lil-gui";
import { LumaSplatsThree } from "luma-web";
import { Camera, Scene, WebGLRenderer } from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

export function DemoVR(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {
	renderer.xr.enabled = true;

	let vrButton = VRButton.createButton(renderer);
	let canvas = renderer.getContext().canvas as HTMLCanvasElement;
	canvas.parentElement!.append(vrButton);

	let splats = new LumaSplatsThree({
		// Kind Humanoid @RyanHickman
		source: 'https://lumalabs.ai/capture/83e9aae8-7023-448e-83a6-53ccb377ec86',
		// disable three.js shader integration for performance
		enableThreeShaderIntegration: false,
	});

	scene.add(splats);

	return {
		dispose: () => {
			splats.dispose();
			vrButton.remove();
		}
	}
}