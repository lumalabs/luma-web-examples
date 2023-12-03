import { LumaSplatsThree } from "@lumaai/luma-web";
import { Color, FogExp2 } from "three";
import { DemoProps } from '.';
import { EnvironmentProbes } from './util/EnvironmentProbes';

export function DemoFog(props: DemoProps) {
	let { renderer, camera, scene, gui } = props;

	// fog
	scene.fog = new FogExp2(new Color(0xe0e1ff).convertLinearToSRGB(), 0.20);
	scene.background = scene.fog.color;

	let splats = new LumaSplatsThree({
		// HOLLYWOOD @DroneFotoBooth
		source: 'https://lumalabs.ai/capture/b5faf515-7932-4000-ab23-959fc43f0d94',
		loadingAnimationEnabled: false,
	});
	scene.add(splats);

	// set ideal initial camera transform
	splats.onInitialCameraTransform = (transform) => {
		camera.matrix.copy(transform);
		camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
		camera.updateMatrixWorld();
	};

	splats.onLoad = () => {
		splats.captureCubemap(renderer).then(environmentMap => {
			scene.environment = environmentMap;
			let environmentProbes = new EnvironmentProbes(4);
			environmentProbes.position.set(-3, 1, 0.25);
			environmentProbes.rotation.y = Math.PI / 2;
			environmentProbes.scale.setScalar(3);
			scene.add(environmentProbes);
		});
	}

	// gui for fog
	gui.add(renderer, 'toneMappingExposure', 0, 10).name('Exposure');
	gui.add(scene.fog, 'density', 0, 0.3).name('Fog Density');
	gui.addColor(scene.fog, 'color').name('Fog Color');

	return {
        dispose: () => {
            // stop worker, free resources
            splats.dispose();
        }
    }
}