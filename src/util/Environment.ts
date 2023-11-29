import { PMREMGenerator, Scene, Texture, WebGLRenderer } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export function loadEnvironment(renderer: WebGLRenderer, scene: Scene, path: string) {
	// environment
	let rgbeLoader = new RGBELoader().load(
		path,
		(texture: Texture) => {
			const pmremGenerator = new PMREMGenerator(renderer)
			pmremGenerator.compileEquirectangularShader();
			const environment = pmremGenerator.fromEquirectangular(texture).texture;
			scene.environment = environment;
			scene.background = environment;
			scene.backgroundBlurriness = 0.5;

			texture.dispose();
			pmremGenerator.dispose();
			rgbeLoader.dispose();
		}
	);
}