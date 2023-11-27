# ![luma-logo](assets/logo.svg) Luma WebGL Examples

`luma-web` is a [npm package](https://www.npmjs.com/package/luma-web) for rendering photoreal interactive scenes captured by the [Luma app](https://lumalabs.ai/). It includes `LumaSplatsWebGL`, which is a WebGL-only gaussian splatting implementation designed to be integrated with 3D frameworks, and `LumaSplatsThree`, which is a Three.js implementation that uses `LumaSplatsWebGL` under the hood. For these examples we'll use [Three.js](https://threejs.org/).

### Contents
- [Getting Started](#getting-started)
- [Background Removal](#background-removal)
- [Three.js Fog](#three.js-fog)
- [Scene Lighting](#scene-lighting)
- [Custom Shaders](#custom-shaders)
- [React Three Fiber](#react-three-fiber)
- [Transparency](#transparency)
- [VR](#vr)

## Getting Started

To get started, install the package:

```bash
npm install @lumai/luma-web
```

And import the `LumaSplatsThree` class:

```ts
import { LumaSplatsThree } from "luma-web";
```

Or if using a browser, include the script:

```html
<script src="https://unpkg.com/@lumai/luma-web"></script>
```

Then in your code, import the `LumaSplatsThree` class, create an instance with a source, and add it to your scene.

`source` can be either of:
- URL to a capture on [lumalabs.ai](https://lumalabs.ai)
- path to a luma splats file or folder containing a luma splats artifacts

**[DemoHelloWorld.ts](./src/DemoHelloWorld.ts)**
```ts
let splats = new LumaSplatsThree({
	source: 'https://lumalabs.ai/capture/ca9ea966-ca24-4ec1-ab0f-af665cb546ff',
});

scene.add(splats);

scene.add(createText());
```

Splats will integrate with the three.js rendering pipeline and interact with other objects via depth testing. However, splats do not currently write to the depth buffer themselves.

### Performance tips

- Use `antialias: false` when creating the renderer to disable MSAA on the canvas. Splats are already anti-aliased and the high instance count in splats is expensive to render with MSAA
- Set `enableThreeShaderIntegration: false` to disable integration with the three.js rendering pipeline. This will disable features like fog and tone mapping, but will improve performance

## Background Removal

Luma scenes can include multiple semantic layers. By default, all layers are rendered. To filter layers, use the `semanticsMask` property. This is a bit mask, so for example, to show only the foreground layer, set `semanticsMask = LumaSplatsSemantics.FOREGROUND`. To show both foreground and background, set `semanticsMask = LumaSplatsSemantics.FOREGROUND | LumaSplatsSemantics.BACKGROUND`

**[DemoBackgroundRemoval.ts](./src/DemoBackgroundRemoval.ts)**
```ts
import { LumaSplatsSemantics, LumaSplatsThree } from "luma-web";

let splats = new LumaSplatsThree({
	source: 'https://lumalabs.ai/capture/1b5f3e33-3900-4398-8795-b585ae13fd2d',
});

scene.add(splats);

// filter splats to only show foreground layers
splats.semanticsMask = LumaSplatsSemantics.FOREGROUND;
```

## Three.js Fog

Luma splats integrate with the three.js rendering pipeline including features like tone mapping, color spaces and fog. Ensure `enableThreeShaderIntegration` is set to `true` (the default) and set the scene fog

**[DemoFog.ts](./src/DemoFog.ts)**
```ts
scene.fog = new FogExp2(new Color(0xe0e1ff).convertLinearToSRGB(), 0.15);
scene.background = scene.fog.color;
```

## Scene Lighting

It's possible to illuminate three.js scenes with luma splats. To do so, we can render a cubemap of the splats and use it as the scene environment. This is done by calling `captureCubeMap` on the splats object. We first wait for the splats to fully load before capturing the cubemap. To ensure the splats are fully rendered at the time of capture, we disable the loading animation.

**[DemoLighting.ts](./src/DemoLighting.ts)**
```ts
let splats = new LumaSplatsThree({
	source: 'https://lumalabs.ai/capture/4da7cf32-865a-4515-8cb9-9dfc574c90c2',

	// disable loading animation so model is fully rendered after onLoad
	loadingAnimationEnabled: false,
});

splats.onLoad = () => {
	let capturedTexture = splats.captureCubeMap(renderer);
	scene.environment = capturedTexture;
	scene.background = capturedTexture;
	scene.backgroundBlurriness = 0.5;
}
```

## Custom Shaders

todo

**[DemoCustomShader.ts](./src/DemoCustomShader.ts)**
```ts
splats.setShaderHooks({
	vertexShaderHooks: {
		additionalUniforms: {
			time_s: ['float', uniformTime],
		},

		getSplatTransform: /*glsl*/`
			(vec3 position, uint layersBitmask) {
				// sin wave on x-axis
				float x = 0.;
				float z = 0.;
				float y = sin(position.x * 2. + time_s) * 0.1 * float(layersBitmask > 1u);
				return mat4(
					1., 0., 0., 0,
					0., 1., 0., 0,
					0., 0., 1., 0,
					x,  y,  z, 1.
				);
			}
		`
	}
});
```

## React Three Fiber

Luma splats can be used with [React Three Fiber](https://docs.pmnd.rs/), a React renderer for Three.js. To do so, we need to extend R3F to include the `LumaSplatsThree` class. This is done by calling `extend` with the class and a name (in this case `LumaSplats` which will be used as the component name). If using TypeScript, we also need to declare the component type.

**[DemoReactThreeFiber.tsx](./src/DemoReactThreeFiber.tsx)**
```typescript
import { Object3DNode, extend } from '@react-three/fiber';
import { LumaSplatsThree } from 'luma-web';

// Make LumaSplatsThree available to R3F
extend( { LumaSplats: LumaSplatsThree } );

// For typeScript support:
declare module '@react-three/fiber' {
  interface ThreeElements {
    lumaSplats: Object3DNode<LumaSplatsThree, typeof LumaSplatsThree>
  }
}

function Scene() {
	return <lumaSplats
		semanticsMask={LumaSplatsSemantics.FOREGROUND}
		source='https://lumalabs.ai/capture/822bac8d-70d6-404e-aaae-f89f46672c67'
		position={[-1, 0, 0]}
		scale={0.5}
	/>
}
```

## Transparency

todo

## VR

todo
