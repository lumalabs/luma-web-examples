/**
 * Todo:
 * - Loads all splats in world sources, initialize all
 * - Capture lighting for all splats
 */

import { LumaSplatsThree } from "@lumaai/luma-web";
import { FrontSide, MathUtils, Mesh, MeshPhysicalMaterial, PerspectiveCamera, Plane, SphereGeometry, Vector3 } from "three";
import { DemoProps } from ".";

const worldSources = [
	// Chateau de Menthon - Annecy @Yannick_Cerrutti 
	'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
	// Arosa Hörnli - Switzerland @splnlss
	'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',	
];

const innerGlobeRadius = 1;
const outerGlobeRadius = 10;

export function DemoTransmission(props: DemoProps) {
	let { renderer, camera, scene, controls, gui } = props;

	controls.enablePan = false;

	let level = 0;

	// state, updated in mainLoop before rendering
	let innerSurfaceDistance = NaN;
	let outerSurfaceDistance = NaN;

	renderer.localClippingEnabled = false;

	// add a refractive transmissive sphere
	let glassGlobe = new Mesh(
		new SphereGeometry(1, 32, 32),
		new MeshPhysicalMaterial({
			roughness: 0,
			metalness: 0,
			transparent: true,
			transmission: 1,
			ior: 1.341,
			thickness: 1.52,
			envMapIntensity: 1.2, // push up the environment map intensity a little
			clearcoat: 1,
			side: FrontSide,
		})
	);
	const initialMaterialProperties = glassGlobe.material.clone();
	glassGlobe.scale.setScalar(innerGlobeRadius);
	scene.add(glassGlobe);

	let globeSplatClippingPlane = new Plane(new Vector3(0, 0, 1), 0);
	let globeSplats = new LumaSplatsThree({
		// Chateau de Menthon - Annecy @Yannick_Cerrutti 
		source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
		enableThreeShaderIntegration: true,
		onBeforeRender: (renderer) => {
			// disable MSAA on render targets (in this case the transmission render target)
			// this improves splatting performance
			let target = renderer.getRenderTarget();
			if (target) {
				target.samples = 0;
			}
			
			let isInsideGlobe = innerSurfaceDistance < 0;

			// only render in targets and not the canvas
			globeSplats.preventDraw = isInsideGlobe ? (target != null) : (target == null)
		}
	});
	globeSplats.material.clipping = false;
	globeSplats.material.clippingPlanes = [globeSplatClippingPlane];
	// disable transparency so the renderer considers it an opaque object
	// opaque objects are rendered in the transmission pass (whereas transparent objects are not)
	globeSplats.material.transparent = false;
	scene.add(globeSplats);

	let environmentSplats = new LumaSplatsThree({
		// Arosa Hörnli - Switzerland @splnlss
		source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',
		loadingAnimationEnabled: false,
		enableThreeShaderIntegration: false,
		onBeforeRender: () => {
			let isInsideGlobe = innerSurfaceDistance < 0;

			environmentSplats.preventDraw = isInsideGlobe;
		}
	});
	scene.add(environmentSplats);

	// capture environment lighting
	environmentSplats.onLoad = () => {
		let capturedTexture = environmentSplats.captureCubeMap(renderer);
		scene.environment = capturedTexture;
		scene.background = capturedTexture;
		scene.backgroundBlurriness = 0.5;
	}

	// main loop
	scene.onBeforeRender = () => {
		// check if camera's near plane is inside the globe
		camera.updateWorldMatrix(true, false);
		let nearVector = new Vector3(0, 0, -(camera as PerspectiveCamera).near);
		let nearWorld = nearVector.applyMatrix4(camera.matrixWorld);
		let distanceToGlobe = nearWorld.distanceTo(glassGlobe.position);
		innerSurfaceDistance = distanceToGlobe - innerGlobeRadius;
		outerSurfaceDistance = distanceToGlobe - outerGlobeRadius;

		/*
		let gap = outerGlobeRadius - innerGlobeRadius;

		function applyCameraModulo() {
			let newInnerSurfaceDistance = MathUtils.euclideanModulo(innerSurfaceDistance, gap);
			let newCameraDistance = newInnerSurfaceDistance + innerGlobeRadius;
			camera.position.setLength(newCameraDistance);
		}

		if (innerSurfaceDistance > gap) {
			applyCameraModulo();
			level++;
		}

		if (innerSurfaceDistance < 0) {
			applyCameraModulo();
			level--;
		}
		*/

		// adjust globe thickness
		glassGlobe.material.thickness = MathUtils.lerp(initialMaterialProperties.thickness, 0, MathUtils.smoothstep(0.2, 0, innerSurfaceDistance));
		glassGlobe.visible = innerSurfaceDistance > 0;
	}


	return {
		dispose: () => {
			globeSplats.dispose();
			environmentSplats.dispose();
		}
	}
}