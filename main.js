import { readFile, writeFile, mkdir, appendFile } from 'fs/promises';
import nodeHtmlToImage from 'node-html-to-image';
import admZip from 'adm-zip';

export const createImages = async (templateFile, outDir, ...csvFiles) => {
	try {
		let template = await readFile(templateFile, 'utf-8');
		let j = 0;
		csvFiles.forEach(async (csvFile) => {
			let csv = (await readFile(csvFile, 'utf-8')).split('\n');
			
			const len = csv.filter((c) => {
				return c.includes('QuestionText,');
			}).length.toString().length;

			await mkdir(outDir, { recursive: true });
			for (let i = 0; i < csv.length; ++i) {
				if (!csv[i].includes('QuestionText,')) { continue; }
				const out = (++j).toString().padStart(len, '0');
				const q = csv[i].slice(csv[i].indexOf(',')+1).replace(/^"|"$/g, '');
				const zipDir = outDir.slice(outDir.indexOf('/')+1).replace('./', '');
				const inject = [
					`Title,"${q}"`,
					'QuestionText,\u200E',
					`Image,${zipDir}/${out}.png`
				];
				csv.splice(i, 1, ...inject);
				i += 2;
				nodeHtmlToImage({
					waitUntil: 'load',
					puppeteerArgs: {
						args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox',
							   '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas',
							   '--no-first-run', '--no-zygote']
					},
					output: `${outDir}/${out}.png`,
					html: template.replace('{question}', q)
				});
			};
			await writeFile(csvFile, csv.join('\n'));
		});
	} catch (err) {
		console.error(err);
	};
};

export const combine = async (csvOut, ...csvFiles) => {
	try {
		csvFiles.forEach(async (csvFile) => {
			let file = await readFile(csvFile, 'utf-8');
			await appendFile(csvOut, file);
		});
	} catch (err) {
		console.error(err);
	};
};

export const repack = async (imageDir, packageFile) => {
	try {
		const unzip = new admZip(packageFile);
		const entry = unzip.getEntry('questiondb.xml');
		let xml = await new Promise((res, rej) => {
			unzip.readAsTextAsync(entry, (txt) => {
				res(txt);
			});
		});

		xml = xml.replace(/render_choice shuffle="no"/g,'render_choice shuffle="yes"');
		unzip.updateFile(entry, xml);
		const zipDir = imageDir.slice(imageDir.indexOf('/')+1).replace('./', '');
		unzip.addLocalFolder(imageDir, zipDir);
		unzip.writeZip(null);
	} catch (err) {
		console.error(err);
	};
};

if (process.argv.length >= 3) {
	import(import.meta.url).then((functions) => {
		if (Object.keys(functions).includes(process.argv[2])) {
			functions[process.argv[2]](...process.argv.splice(3));
		};
	});
};
