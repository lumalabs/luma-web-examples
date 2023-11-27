import GUI from 'lil-gui';
import { LumaSplatsThree } from "luma-web";
import { Camera, Color, FogExp2, Scene, WebGLRenderer } from "three";

export function DemoFog(renderer: WebGLRenderer, scene: Scene, camera: Camera, gui: GUI) {
	
	// tone mapping exposure
	gui.add(renderer, 'toneMappingExposure', 0, 10).name('Exposure');

	// fog
	scene.fog = new FogExp2(new Color(0xe0e1ff).convertLinearToSRGB(), 0.15);
	scene.background = scene.fog.color;

	// gui for fog
	gui.add(scene.fog, 'density', 0, 0.3).name('Fog Density');
	gui.addColor(scene.fog, 'color').name('Fog Color');

	let splats = new LumaSplatsThree({ source: 'https://lumalabs.ai/capture/b5faf515-7932-4000-ab23-959fc43f0d94' });
	scene.add(splats);

	// set ideal initial camera transform
	splats.onInitialCameraTransform = (transform) => {
		camera.matrix.copy(transform);
		camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.updateMatrixWorld();
	};

	return {
        dispose: () => {
            // stop worker, free resources
            splats.dispose();
        }
    }
}