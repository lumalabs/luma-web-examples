import { LumaSplatsLoader } from "@lumaai/luma-web";

export async function downloadArtifacts(splatLoader: LumaSplatsLoader, onProgress: (progress: number) => void = ()=>{}) {
	let artifacts: { [key: string]: string | undefined } = await splatLoader.getArtifacts();

	// we care about the following
	let required = [
		'gs_web_meta',
		'gs_web_gauss1',
		'gs_web_gauss2',
		'gs_web_sh',
		'gs_web_webmeta',
		'gs_compressed_meta',
     	'gs_compressed',
		'with_background_gs_camera_params',
		'semantics',
	];

	let totalFiles = required.reduce((total, key) => {
		return artifacts[key] ? (total + 1) : total
	}, 0);
	let filesCompete = 0;

	onProgress(0);
	
	let blobs = required.map(async key => {
		let url = artifacts[key];
		if (!url) {
			console.log('missing', key);
			return null;
		}

		let urlFilename = url?.split('/').pop();
		let fileType = urlFilename?.split('.').pop();

		let filename = `${key}.${fileType}`;

		console.log('downloading', filename);

		let response = await fetch(url);
		let blob = await response.blob();

		filesCompete++;
		onProgress(filesCompete / totalFiles);

		return {filename, url, blob};
	});

	// trigger download for all the files
	let files = await Promise.all(blobs);
	files.forEach(file => {
		if (!file) {
			return;
		}
		let {filename, blob} = file;
		let url = URL.createObjectURL(blob);
		let link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
	});

	onProgress(1);
}

export function createDownloadArtifactsButton(splatLoader: LumaSplatsLoader) {
	

	// add download button
	let downloadButton = document.createElement('button');
	downloadButton.innerText = 'Download Artifacts';
	downloadButton.style.position = 'absolute';
	downloadButton.style.bottom = '5px';
	downloadButton.style.left = '5px';
	downloadButton.style.zIndex = '100';
	downloadButton.onclick = (e) => {
		downloadArtifacts(splatLoader, progress => {
			if (progress < 1) {
				downloadButton.innerText = `Downloading ${Math.floor(progress * 100)}%`;
			} else {
				downloadButton.innerText = 'Download Artifacts';
			}
		});
	};

	return downloadButton;
}