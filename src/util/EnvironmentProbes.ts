import { Color, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from "three";

export class EnvironmentProbes extends Object3D {

	constructor(gridSize: number = 3) {
		super();
		// add grid of spheres to test lighting
		let sphereGeometry = new SphereGeometry(0.05, 32, 32);

		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				for (let k = 0; k < gridSize; k++) {
					let roughness = i / (gridSize - 1);
					let metalness = j / (gridSize - 1);
					let color = k / (gridSize - 1);
					let sphere = new Mesh(sphereGeometry, new MeshStandardMaterial({
						color: new Color(color, color, color),
						roughness: roughness,
						metalness: metalness,
					}));
					sphere.position.set(i, j, k).subScalar((gridSize - 1) / 2).multiplyScalar(0.25);
					this.add(sphere);
				}
			}
		}
	}

	dispose() {
		this.traverse((child) => {
			if (child instanceof Mesh) {
				child.geometry.dispose();
				child.material.dispose();
			}
		});
	}

}