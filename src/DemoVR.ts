import { LumaSplatsThree } from "@lumaai/luma-web";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { DemoProps } from ".";

export function DemoVR(props: DemoProps) {
	let { renderer, camera, scene, controls, gui } = props;

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