import { LumaSplatsThree } from "luma-web";
import { Camera, Color, DoubleSide, Mesh, MeshStandardMaterial, PlaneGeometry, Scene, Texture, WebGLRenderer } from "three";

export function DemoHelloWorld(renderer: WebGLRenderer, scene: Scene, camera: Camera) {

	scene.background = new Color('white');

	let splats = new LumaSplatsThree({
		// MIT WPU Globe @krazyykrunal
		source: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
		// we disable full three.js for performance
		enableThreeShaderIntegration: false,
	});

	scene.add(splats);

	// the splats file can provide an ideal initial viewing location
	splats.onInitialCameraTransform = transform => {
		camera.matrix.copy(transform);
		camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
	};

	scene.add(createText());

	return {
		dispose: () => {
			// stop worker, free resources
			splats.dispose();
		}
	}
}

// create a plane with "Hello World" text
function createText() {
	// create canvas
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d')!;
	canvas.width = 1024;
	canvas.height = 512;

	// clear white, 0 alpha
	context.fillStyle = 'rgba(255, 255, 255, 0)';
	context.fillRect(0, 0, canvas.width, canvas.height);

	// draw text
	context.fillStyle = 'white';
	// 100px helvetica, arial, sans-serif
	context.font = '200px sans-serif';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	// stroke
	context.strokeStyle = 'rgba(0, 0, 0, 0.5)'
	context.lineWidth = 5;
	context.fillText('Hello World', canvas.width / 2, canvas.height / 2);
	context.strokeText('Hello World', canvas.width / 2, canvas.height / 2);

	// create texture from canvas
	const texture = new Texture(canvas);
	texture.needsUpdate = true;

	// create plane geometry and mesh with the texture
	const geometry = new PlaneGeometry(5, 2.5);
	const material = new MeshStandardMaterial({
		map: texture,
		transparent: false,
		alphaTest: 0.5,
		side: DoubleSide,
		premultipliedAlpha: true,
		emissive: 'white',
		emissiveIntensity: 2,
	});
	const textPlane = new Mesh(geometry, material);

	// position and rotate
	textPlane.position.set(0.8, -0.9, 0);
	textPlane.rotation.y = Math.PI / 2;
	textPlane.scale.setScalar(0.6);

	return textPlane;
}