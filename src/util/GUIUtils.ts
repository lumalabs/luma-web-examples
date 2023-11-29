import GUI from "lil-gui";
import { AdditiveBlending, CustomBlending, MeshPhysicalMaterial, MultiplyBlending, NoBlending, NormalBlending, SubtractiveBlending } from "three";

export function addMaterial(gui: GUI, material: MeshPhysicalMaterial, name: string) {
	let materialFolder = gui.addFolder(name);
	materialFolder.addColor(material, 'color');
	materialFolder.add(material, 'flatShading');
	materialFolder.add(material, 'depthWrite');
	materialFolder.add(material, 'depthTest');
	materialFolder.add(material, 'transparent');
	materialFolder.add(material, 'blending', {
		NoBlending,
		NormalBlending,
		AdditiveBlending,
		SubtractiveBlending,
		MultiplyBlending,
		CustomBlending,
	});
	materialFolder.add(material, 'premultipliedAlpha');
	materialFolder.add(material, 'opacity', 0, 1);
	materialFolder.add(material, 'metalness', 0, 1);
	materialFolder.add(material, 'roughness', 0, 1);
	materialFolder.add(material, 'emissiveIntensity', 0, 4);
	materialFolder.add(material, 'iridescence', 0, 1);
	materialFolder.add(material, 'iridescenceIOR', 0, 3);
	let iridescenceThicknessRange = { min: 0, max: 1  };
	materialFolder.add(iridescenceThicknessRange, 'min', 0, 1).onChange(() => {
		material.iridescenceThicknessRange = [iridescenceThicknessRange.min, iridescenceThicknessRange.max];
	});
	materialFolder.add(iridescenceThicknessRange, 'max', 0, 1).onChange(() => {
		material.iridescenceThicknessRange = [iridescenceThicknessRange.min, iridescenceThicknessRange.max];
	});
	materialFolder.add(material, 'envMapIntensity', 0, 4);

	// transmission
	materialFolder.add(material, 'transmission', 0, 1);
	materialFolder.add(material, 'ior', 0, 3);
	materialFolder.add(material, 'thickness', 0, 10);
	materialFolder.addColor(material, 'attenuationColor');
	materialFolder.add(material, 'attenuationDistance', 0, 10);

	// clearcoat
	materialFolder.add(material, 'clearcoat', 0, 1);
	materialFolder.add(material, 'clearcoatRoughness', 0, 1);
	materialFolder.add(material, 'reflectivity', 0, 1);

	return materialFolder;
}