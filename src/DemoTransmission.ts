/**
 * Todo:
 * - Loads all splats in world sources, initialize all
 * - Capture lighting for all splats
 */

import { LumaSplatsThree } from "@lumaai/luma-web";
import { NoToneMapping, LinearToneMapping, CineonToneMapping, ReinhardToneMapping, ACESFilmicToneMapping, WebGLRenderer, WebGLRenderTarget, CubeTexture, FrontSide, MathUtils, Mesh, MeshPhysicalMaterial, PerspectiveCamera, SphereGeometry, Vector3 } from "three";
import { DemoProps } from ".";
import { addMaterial } from "./util/GUIUtils";

const worldSources = [
	// Chateau de Menthon - Annecy @Yannick_Cerrutti 
	{ source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c', scale: 1 },
	// Arosa Hörnli - Switzerland @splnlss
	{ source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2', scale: 1 },
	// Fish reefs – Okinawa @BBCG
	{ source: 'https://lumalabs.ai/capture/6331c1bb-3352-4c8e-b691-32b9b70ec768', scale: 1 },
	// Glacial Erratic - Aspen, Colorado @VibrantNebula_Luma
	{ source: 'https://lumalabs.ai/capture/f513900b-69fe-43c8-a72e-80b8d5a16fa4', scale: 1 },
	// Meta Girl (Oleg Lobykin) | Burning Man 2022 @VibrantNebula_Luma
	// { source: 'https://lumalabs.ai/capture/2d57866c-83dc-47a6-a725-69c27f75ddb0', scale: 1 },
	// Pinkerton Hot Springs @VibrantNebula_Luma
	{ source: 'https://lumalabs.ai/capture/a5e98f35-3759-4cf5-a226-079b15c805da', scale: 1 },
	// HOLLYWOOD @DroneFotoBooth
	// { source: 'https://lumalabs.ai/capture/b5faf515-7932-4000-ab23-959fc43f0d94', scale: 1 },
	// Metropolis @fotozhora_sk
	{ source: 'https://lumalabs.ai/capture/d2d2badd-8bdd-4874-84f7-9df2aae27f29', scale: 1 },
];

const innerGlobeRadius = 1;
const outerGlobeRadius = 8;
const radiusGap = outerGlobeRadius - innerGlobeRadius;

export function DemoTransmission(props: DemoProps) {
	let { renderer, camera, scene, controls, gui } = props;

	renderer.toneMapping = NoToneMapping;
	renderer.localClippingEnabled = false;

	controls.enablePan = false;
	controls.autoRotate = false;
	camera.position.y = 3;
	camera.position.setLength(innerGlobeRadius + radiusGap * 0.25);

	// state, updated in mainLoop before rendering
	let state = {
		level: 0,
		innerSplatIndex: NaN,
		outerSplatIndex: NaN,
		animate: true,
	}

	// add tonemapping gui
	gui.add(renderer, 'toneMappingExposure', 0, 10).name('Exposure');
	gui.add(renderer, 'toneMapping', {
		NoToneMapping,
		LinearToneMapping,
		CineonToneMapping,
		ReinhardToneMapping,
		ACESFilmicToneMapping,
	}).name('Tone Mapping');
	gui.add(state, 'animate').name('Animate');

	// space key to toggle animation
	window.addEventListener('keydown', (e) => {
		if (e.code === 'Space') {
			state.animate = !state.animate;
		}
	});

	// add a refractive transmissive sphere
	let glassGlobe = new Mesh(
		new SphereGeometry(1, 32, 32),
		new MeshPhysicalMaterial({
			roughness: 0,
			metalness: 0,
			transparent: true,
			transmission: 1,
			ior: 1.341,
			// thickness: 1.52,
			thickness: 2,
			envMapIntensity: 1.2, // push up the environment map intensity a little
			clearcoat: 1,
			side: FrontSide,
		})
	);
	const initialMaterialProperties = { ...glassGlobe.material };
	addMaterial(gui, glassGlobe.material, 'Glass Globe');
	gui.add(glassGlobe, 'renderOrder', -1, 1).step(1);
	glassGlobe.scale.setScalar(innerGlobeRadius);
	scene.add(glassGlobe);

	const splatWorlds = worldSources.map((world, index) => {
		let splat = new LumaSplatsThree({
			source: world.source,
			// disable loading animation so we can capture an environment map as soon as it's loaded
			loadingAnimationEnabled: false,
			onBeforeRender: (renderer) => {
				let renderTarget = renderer.getRenderTarget();
				disableMSAA(renderTarget);

				let isWithinGlobe = state.innerSplatIndex === index;
				let isCubeRenderTarget = (renderTarget?.texture as any)?.isCubeTexture === true;
				if (isCubeRenderTarget) {
					splat.preventDraw = false;
				} else {
					if (isWithinGlobe) {
						// disable rendering to canvas
						splat.preventDraw = renderTarget == null;
					} else {
						// disable rendering to transmission
						splat.preventDraw = renderTarget != null;
					}
				}
			}
		});
		splat.scale.setScalar(world.scale);
		
		let splatWorld = {
			environmentMap: null as CubeTexture | null,
			splat,
		}

		// capture environment lighting after load
		splat.onLoad = () => {
			splat.captureCubemap(renderer).then((cubemap) => {
				splatWorld.environmentMap = cubemap;
			});
		}

		return splatWorld;
	});

	// main loop
	let lastFrameTime_ms = performance.now();
	scene.onBeforeRender = () => {
		let t_ms = performance.now();

		let dt_s = (t_ms - lastFrameTime_ms) / 1000;
		lastFrameTime_ms = t_ms;

		if (state.animate) {
			let cameraRadialVector = camera.position.clone().normalize();
			camera.position.addScaledVector(cameraRadialVector, dt_s);
			// rotate around y axis
			camera.position.applyAxisAngle(new Vector3(0, 1, 0), dt_s * 0.5);
			camera.lookAt(new Vector3(0, 0, 0));
		}

		// check if camera's near plane is inside the globe
		camera.updateWorldMatrix(true, false);
		let near = (camera as PerspectiveCamera).near;
		// let nearVector = new Vector3(0, 0, -near);
		// let nearWorld = nearVector.applyMatrix4(camera.matrixWorld);
		// let distanceToCenter = nearWorld.distanceTo(glassGlobe.position);
		let nearPlaneDistanceToCenter = camera.position.length() - near;
		let innerSurfaceDistance = nearPlaneDistanceToCenter - innerGlobeRadius;

		function applyCameraModulo() {
			let newInnerSurfaceDistance = MathUtils.euclideanModulo(innerSurfaceDistance, radiusGap);
			let newCameraDistance = newInnerSurfaceDistance + innerGlobeRadius + near;
			camera.position.setLength(newCameraDistance);
			// update innerSurfaceDistance and outerSurfaceDistance
			innerSurfaceDistance = newInnerSurfaceDistance;

			camera.updateWorldMatrix(true, false);
		}

		if (innerSurfaceDistance > radiusGap) {
			applyCameraModulo();
			state.level++;
		}

		if (innerSurfaceDistance < 0) {
			applyCameraModulo();
			state.level--;
		}

		// determine camera position in the range [0, 1] where 0 is inside the inner globe and 1 is outside the outer globe
		// after modulo
		let cameraU = innerSurfaceDistance / radiusGap;

		// use level to set scene state
		state.innerSplatIndex = MathUtils.euclideanModulo(state.level - 1, splatWorlds.length);
		state.outerSplatIndex = MathUtils.euclideanModulo(state.level, splatWorlds.length);

		for (let i = 0; i < splatWorlds.length; i++) {
			let splatWorld = splatWorlds[i];
			let splat = splatWorld.splat;

			let isInnerSplat = state.innerSplatIndex === i;
			let isOuterSplat = state.outerSplatIndex === i;
			let isVisible = state.innerSplatIndex === i || state.outerSplatIndex === i;
			// disable enableThreeShaderIntegration to improve performance when not required
			// we must do this before splat.onBeforeRender is called because by then it's too late to change material for the frame
			splat.enableThreeShaderIntegration = isInnerSplat;
			splat.material.transparent = !isInnerSplat;

			if (isVisible) {
				scene.add(splat);
			} else {
				scene.remove(splat);
			}

			// make the world lit by the outer splat
			if (isOuterSplat) {
				if (scene.environment != splatWorld.environmentMap) {
					scene.environment = splatWorld.environmentMap;
					scene.background = splatWorld.environmentMap;
				}
			}

			// scale the inner splat for continuity across the boundary
			if (isInnerSplat) {
				let r = innerGlobeRadius / outerGlobeRadius;
				// splat.scale.setScalar(MathUtils.lerp(r, 1, cameraU));
				splat.scale.setScalar(r);
			} else {
				splat.scale.setScalar(1);
			}

			if (isVisible) {
				splat.updateMatrix();
				splat.updateMatrixWorld();
			}
		}

		// adjust globe thickness
		glassGlobe.material.thickness = MathUtils.lerp(initialMaterialProperties.thickness, 0, MathUtils.smoothstep(0.2, 0, innerSurfaceDistance));
		// glassGlobe.visible = innerSurfaceDistance > 0;

		// scale the globe to appear
		let s = 1 - cameraU;
		glassGlobe.scale.setScalar(MathUtils.smootherstep(s, 0.0, 0.2));
		glassGlobe.updateMatrix();
		glassGlobe.updateMatrixWorld();
		// glassGlobe.material.opacity = MathUtils.lerp(1, 0, cameraU * cameraU * cameraU);
	}

	return {
		dispose: () => {
			for (let splatWorld of splatWorlds) {
				splatWorld.splat.dispose();
			}
		}
	}
}

function disableMSAA(target: WebGLRenderTarget | null) {
	// disable MSAA on render targets (in this case the transmission render target)
	// this improves splatting performance
	if (target) {
		target.samples = 0;
	}
}