document.addEventListener('DOMContentLoaded', () => {
	const paletteContainer = document.getElementById('palette-container');
	const generateBtn = document.getElementById('generate-btn');
	const exportBtn = document.getElementById('export-btn');
	const exportModal = document.getElementById('export-modal');
	const closeBtn = document.querySelector('.close-btn');
	const toast = document.getElementById('toast');

	let colors = [];
	const colorCount = 5;

	function init() {
		for (let i = 0; i < colorCount; i++) {
			colors.push(generateRandomColor());
		}
		renderPalette();
		lucide.createIcons();
	}

	function generateRandomColor() {
		const h = Math.floor(Math.random() * 360);
		const s = Math.floor(Math.random() * 70) + 20;
		const l = Math.floor(Math.random() * 60) + 20;
		return {
			h, s, l,
			locked: false,
			id: Date.now() + Math.random()
		};
	}

	function hexToHsl(hex) {
		let r = 0, g = 0, b = 0;
		if (hex.length === 4) {
			r = "0x" + hex[1] + hex[1];
			g = "0x" + hex[2] + hex[2];
			b = "0x" + hex[3] + hex[3];
		} else if (hex.length === 7) {
			r = "0x" + hex[1] + hex[2];
			g = "0x" + hex[3] + hex[4];
			b = "0x" + hex[5] + hex[6];
		}
		r /= 255;
		g /= 255;
		b /= 255;
		let cmin = Math.min(r, g, b),
			cmax = Math.max(r, g, b),
			delta = cmax - cmin,
			h = 0,
			s = 0,
			l = 0;

		if (delta === 0) h = 0;
		else if (cmax === r) h = ((g - b) / delta) % 6;
		else if (cmax === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;

		h = Math.round(h * 60);

		if (h < 0) h += 360;

		l = (cmax + cmin) / 2;
		s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
		s = +(s * 100).toFixed(1);
		l = +(l * 100).toFixed(1);

		return { h: Math.round(h), s: Math.round(s), l: Math.round(l) };
	}

	function hslToHex(h, s, l) {
		l /= 100;
		const a = s * Math.min(l, 1 - l) / 100;
		const f = n => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color).toString(16).padStart(2, '0');
		};
		return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
	}

	function hslToRgb(h, s, l) {
		s /= 100;
		l /= 100;
		const k = n => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return `rgb(${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))})`;
	}

	function renderPalette() {
		paletteContainer.innerHTML = '';
		colors.forEach((color, index) => {
			const hex = hslToHex(color.h, color.s, color.l);
			const isDark = color.l < 50;
			const textColor = isDark ? '#ffffff' : '#000000';

			const col = document.createElement('div');
			col.className = `color-col ${color.locked ? 'is-locked' : ''}`;
			col.style.backgroundColor = hex;
			col.style.color = textColor;

			col.innerHTML = `
                <div class="color-hex" title="Click to copy">${hex}</div>
                <div class="color-controls">
					<div class="control-actions">
						<button class="control-btn toggle-lock" data-index="${index}" title="Toggle lock">
							<i data-lucide="lock" class="locked-icon"></i>
							<i data-lucide="unlock" class="unlocked-icon"></i>
						</button>
						<button class="control-btn edit-btn" data-index="${index}" title="Edit color">
							<i data-lucide="pencil"></i>
						</button>
					</div>
					<input type="color" class="color-input" data-index="${index}" value="${hex}" style="position: absolute; opacity: 0; pointer-events: none; bottom: 0; left: 0;">
                    <div class="slider-group">
                        <label>Saturation</label>
                        <input type="range" class="sat-slider" data-index="${index}" min="0" max="100" value="${color.s}" style="accent-color: ${hex}">
                    </div>
                    <div class="slider-group">
                        <label>Brightness</label>
                        <input type="range" class="light-slider" data-index="${index}" min="0" max="100" value="${color.l}" style="accent-color: ${hex}">
                    </div>
                </div>
            `;
			paletteContainer.appendChild(col);
		});
		lucide.createIcons();
		attachEventListeners();
	}

	function attachEventListeners() {
		document.querySelectorAll('.toggle-lock').forEach(btn => {
			btn.onclick = (e) => {
				const idx = e.currentTarget.dataset.index;
				colors[idx].locked = !colors[idx].locked;
				renderPalette();
			};
		});

		document.querySelectorAll('.edit-btn').forEach(btn => {
			btn.onclick = (e) => {
				const idx = e.currentTarget.dataset.index;
				const input = paletteContainer.children[idx].querySelector('.color-input');
				input.click();
			};
		});

		document.querySelectorAll('.color-input').forEach(input => {
			input.oninput = (e) => {
				const idx = e.target.dataset.index;
				const hex = e.target.value;
				const { h, s, l } = hexToHsl(hex);
				colors[idx].h = h;
				colors[idx].s = s;
				colors[idx].l = l;
				updateColorRealtime(idx);

				const col = paletteContainer.children[idx];
				col.querySelector('.sat-slider').value = s;
				col.querySelector('.light-slider').value = l;
			};
		});

		document.querySelectorAll('.color-hex').forEach(el => {
			el.onclick = () => copyToClipboard(el.textContent);
		});

		document.querySelectorAll('.sat-slider').forEach(slider => {
			slider.oninput = (e) => {
				const idx = e.target.dataset.index;
				colors[idx].s = parseInt(e.target.value);
				updateColorRealtime(idx);
			};
		});

		document.querySelectorAll('.light-slider').forEach(slider => {
			slider.oninput = (e) => {
				const idx = e.target.dataset.index;
				colors[idx].l = parseInt(e.target.value);
				updateColorRealtime(idx);
			};
		});
	}

	function updateColorRealtime(index) {
		const color = colors[index];
		const hex = hslToHex(color.h, color.s, color.l);
		const col = paletteContainer.children[index];
		col.style.backgroundColor = hex;
		const isDark = color.l < 50;
		col.style.color = isDark ? '#ffffff' : '#000000';
		col.querySelector('.color-hex').textContent = hex;
		col.querySelector('.color-input').value = hex;

		col.querySelectorAll('input[type="range"]').forEach(slider => {
			slider.style.accentColor = hex;
		});
	}

	function generateNewPalette() {
		colors = colors.map(color => color.locked ? color : generateRandomColor());
		renderPalette();
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			showToast(`Copied ${text} to clipboard!`);
		});
	}

	function showToast(message) {
		toast.textContent = message;
		toast.classList.add('show');
		setTimeout(() => toast.classList.remove('show'), 2000);
	}

	function openExport() {
		const hexCodes = colors.map(c => hslToHex(c.h, c.s, c.l)).join(', ');
		const rgbCodes = colors.map(c => hslToRgb(c.h, c.s, c.l)).join(', ');
		const hslCodes = colors.map(c => `hsl(${c.h}, ${c.s}%, ${c.l}%)`).join(', ');

		document.getElementById('export-hex').value = hexCodes;
		document.getElementById('export-rgb').value = rgbCodes;
		document.getElementById('export-hsl').value = hslCodes;

		exportModal.style.display = 'block';
	}

	generateBtn.onclick = generateNewPalette;
	exportBtn.onclick = openExport;
	closeBtn.onclick = () => exportModal.style.display = 'none';
	window.onclick = (e) => { if (e.target == exportModal) exportModal.style.display = 'none'; };

	document.querySelectorAll('.copy-btn').forEach(btn => {
		btn.onclick = () => {
			const targetId = btn.dataset.target;
			const text = document.getElementById(targetId).value;
			copyToClipboard(text);
		};
	});

	window.onkeydown = (e) => {
		if (e.code === 'Space') {
			e.preventDefault();
			generateNewPalette();
		}
	};

	init();
});
