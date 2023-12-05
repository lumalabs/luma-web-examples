import { AdaptiveDpr, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { OrbitControls as OrbitControlsStdLib } from 'three-stdlib';
import { Canvas, useThree } from '@react-three/fiber';
import GUI from 'lil-gui';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Camera, CineonToneMapping, Scene, WebGLRenderer } from 'three';
import readme from '../README.md';
import { DemoBackgroundRemoval } from './DemoBackgroundRemoval';
import { DemoCustomShaders } from './DemoCustomShaders';
import { DemoFog } from './DemoFog';
import { DemoHelloWorld } from './DemoHelloWorld';
import { DemoLighting } from './DemoLighting';
import { DemoReactThreeFiber } from './DemoReactThreeFiber';
import { DemoTransmission } from './DemoTransmission';
import { DemoVR } from './DemoVR';

export type DemoProps = {
	renderer: WebGLRenderer,
	scene: Scene,
	camera: Camera,
	controls: OrbitControlsStdLib,
	gui: GUI,
}

type DemoFn =
	(props: DemoProps)
		=> { dispose: () => void } | void;

const demos = {
	basic: {
		"getting-started": DemoHelloWorld,
		"three-fog": DemoFog,
		"background-removal": DemoBackgroundRemoval,
		"scene-lighting": DemoLighting,
		"custom-shaders": DemoCustomShaders,
		"transmission": DemoTransmission,
		"vr": DemoVR,
	} as Record<string, DemoFn>,
	react: {
		"react-three-fiber": DemoReactThreeFiber
	} as Record<string, React.FC<{ gui: GUI }>>
}

let globalGUI: GUI | null = null;

function DemoScene(props: {
	expanded: boolean,
	demoBasicFn: DemoFn | null,
	demoReactFn: React.FC<{ gui: GUI }> | null,
	onExpandToggle: (expanded: boolean) => void,
}) {
	let { scene, gl: renderer, camera } = useThree();
	
	let [gui, setGUI] = useState<GUI | null>(globalGUI);
	let [autoRotate, setAutoRotate] = useState(true);
	let [showUI, setShowUI] = useState(true);
	let controlsRef = useRef<OrbitControlsStdLib | null>(null);

	useEffect(() => {
		globalGUI?.destroy();

		globalGUI = new GUI({
			container: renderer.domElement.parentElement!,
		});
		globalGUI.close();
		globalGUI.domElement.style.position = 'absolute';
		globalGUI.domElement.style.top = '0';
		globalGUI.domElement.style.right = '0';
		globalGUI.domElement.style.zIndex = '1000';
		globalGUI.domElement.addEventListener('pointerdown', (e) => {
			e.stopPropagation();
		});

		let pixelRatioProxy = {
			get pixelRatio() {
				return renderer.getPixelRatio()
			},
			set pixelRatio(value: number) {
				renderer.setPixelRatio(value);

				// update url parameter
				let url = new URL(window.location.href);
				url.searchParams.set('pixelRatio', value.toString());
				window.history.replaceState({}, '', url.href);
			}
		}
		// initial pixel ratio from url parameter if available
		const url = new URL(window.location.href);
		let pixelRatioParam = url.searchParams.get('pixelRatio');
		if (pixelRatioParam != null) {
			pixelRatioProxy.pixelRatio = parseFloat(pixelRatioParam);
		}
		
		globalGUI.add(pixelRatioProxy, 'pixelRatio', 0.5, window.devicePixelRatio, 0.25).name('Pixel Ratio');

		setGUI(globalGUI);

		let demoProps = {
			renderer,
			scene,
			camera,
			controls: controlsRef.current!,
			gui: globalGUI,
		}

		if (props.demoBasicFn) {
			let demoDispose = props.demoBasicFn(demoProps)?.dispose;

			return () => {
				// call .dispose() on all objects in the scene
				scene.traverse((obj) => {
					(obj as any).dispose?.();
				});

				demoDispose?.();

				renderer.dispose();

				globalGUI?.destroy();
				globalGUI = null;
			}
		}
	}, []);

	useEffect(() => {
		// h key to hide/show gui
		function toggleGUI(e: KeyboardEvent) {
			if (e.key === 'h') {
				if (showUI) {
					gui?.hide();
					setShowUI(false);
				} else {
					gui?.show();
					setShowUI(true);
				}
			}
		}

		window.addEventListener('keydown', toggleGUI);

		let expandButton = document.createElement('div');
		expandButton.style.visibility = showUI ? 'visible' : 'hidden';
		expandButton.className = 'expand-button ' + (props.expanded ? 'icon-compress' : 'icon-expand');
		expandButton.onclick = () => {
			props.onExpandToggle(!props.expanded);
		}
		renderer.domElement.parentElement!.prepend(expandButton);

		return () => {
			window.removeEventListener('keydown', toggleGUI);
			expandButton.remove();
		}
	}, [props.expanded, showUI, gui]);

	return <>
		<PerspectiveCamera />
		<OrbitControls
			ref={controlsRef}
			autoRotate={autoRotate}
			autoRotateSpeed={0.5}
			enableDamping={true}
			// disable auto rotation when user interacts
			onStart={() => {
				setAutoRotate(false);
			}}
			makeDefault
		/>
		{props.demoReactFn && gui && <props.demoReactFn gui={gui} />}
	</>
}

function App() {
	const demoKeys = Object.keys(demos.basic).concat(Object.keys(demos.react));

	const [demoKey, setDemoKey] = useState<string | null>(() => {
		// get url parameter
		const url = new URL(window.location.href);
		let demoParam = url.hash.replace(/^#/, '');
		let demoExists = demoParam != null && demoKeys.includes(demoParam);
		return demoExists ? demoParam : demoKeys[0];
	});
	
	const [showDocs, setShowDocs] = useState(() => {
		// get url parameter
		const url = new URL(window.location.href);
		return url.searchParams.get('hide-docs') == null;
	});

	useEffect(() => {
		// update hide-docs url parameter
		let url = new URL(window.location.href);
		if (!showDocs) {
			url.searchParams.set('hide-docs', '');
		} else {
			url.searchParams.delete('hide-docs');
		}
		window.history.replaceState({}, '', url.href);
	}, [showDocs]);

	const demoBasicFn = demoKey != null ? demos.basic[demoKey] : null;
	const demoReactFn = demoKey != null ? demos.react[demoKey] : null;
	const hasDemo = demoBasicFn != null || demoReactFn != null;
	
	useEffect(() => {
		// react to url changes
		window.addEventListener('hashchange', () => {
			setDemoKey(window.location.hash.replace(/^#/, ''));
		});

		// scroll to demo
		if (demoKey) {
			document.getElementById(demoKey)?.scrollIntoView({ behavior: 'smooth' });
		}

		// press e to expand demo
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'e') {
				setShowDocs(e => !e);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		}
	}, []);

	return <>
		{showDocs && <div className='demo-menu'>
			<Markdown
				components={{
					h2(props) {
						const { node, children, ...rest } = props;
						let id = (node as any).children[0].value.toLowerCase().replace(/\s/g, '-');
						const isActive = id === demoKey;
						function activateDemo(e: React.MouseEvent<HTMLHeadingElement, MouseEvent>) {
							document.getElementById(id)?.querySelector('a')?.click();
							// setDemoKey(id);
							// document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
						}
						// make clickable
						return <h2
							{...rest}
							id={id}
							onClick={activateDemo}
							className={isActive ? 'active' : ''}
						>
							<a href={`#${id}`}>{children}</a>
							{!isActive && <button >View Demo</button>}
						</h2>;
					},
					code(props) {
						const { children, className, node, ref, ...rest } = props
						const match = /language-(\w+)/.exec(className || '')
						return match ? (
							<SyntaxHighlighter
								{...rest}
								children={String(children).replace(/\n$/, '')}
								language={match[1]}
								style={syntaxTheme}
							/>
						) : (
							<code {...rest} className={className}>
								{children}
							</code>
						)
					},
					a(props) {
						let { href, ...rest } = props;
						
						// replace ./src links with github links for better readability
						if (href?.startsWith('./src')) {
							href = 'https://github.com/lumalabs/luma-web-examples/blob/main/' + href.slice(1);
						}

						let isAbsolute = /^https?:\/\//.test(href ?? '');
						if (isAbsolute) {
							// open in new tab
							return <a {...rest} href={href} target='_blank' rel='noopener noreferrer' />
						} else {
							return <a {...rest} href={href} />
						}
					}
				}}
			>{readme}</Markdown>
		</div>}

		{hasDemo && <Canvas
			gl={{
				antialias: false,
				toneMapping: CineonToneMapping,
			}}
			key={demoKey}
			style={{
				minWidth: '10px',
			}}
			onPointerDown={(e) => {
				// prevent text selection
				e.preventDefault();
			}}
		>
			<AdaptiveDpr pixelated />
			<DemoScene
				key={demoKey}
				expanded={!showDocs}
				onExpandToggle={(expanded) => {
					setShowDocs(!expanded);
				}}
				demoBasicFn={demoBasicFn}
				demoReactFn={demoReactFn}
			/>
		</Canvas>}
	</>
}

const reactRoot = document.getElementById('react-root');
createRoot(reactRoot!).render(<App />);