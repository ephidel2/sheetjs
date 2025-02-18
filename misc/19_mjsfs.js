let _fs = void 0;
function set_fs(fs) { _fs = fs; }
export { set_fs };

/* normalize data for blob ctor */
function blobify(data) {
	if(typeof data === "string") return s2ab(data);
	if(Array.isArray(data)) return a2u(data);
	return data;
}
/* write or download file */
function write_dl(fname/*:string*/, payload/*:any*/, enc/*:?string*/) {
	/*global IE_SaveFile, Blob, navigator, saveAs, document, File, chrome */
	if(typeof _fs !== 'undefined' && _fs.writeFileSync) return enc ? _fs.writeFileSync(fname, payload, enc) : _fs.writeFileSync(fname, payload);
	if(typeof Deno !== 'undefined') {
		/* in this spot, it's safe to assume typed arrays and TextEncoder/TextDecoder exist */
		if(enc) switch(enc) {
			case "utf8": payload = new TextEncoder(enc).encode(payload); break;
			case "binary": payload = s2ab(payload); break;
			/* TODO: binary equivalent */
			default: throw new Error("Unsupported encoding " + enc);
		}
		return Deno.writeFileSync(fname, payload);
	}
	var data = (enc == "utf8") ? utf8write(payload) : payload;
	/*:: declare var IE_SaveFile: any; */
	if(typeof IE_SaveFile !== 'undefined') return IE_SaveFile(data, fname);
	if(typeof Blob !== 'undefined') {
		var blob = new Blob([blobify(data)], {type:"application/octet-stream"});
		/*:: declare var navigator: any; */
		if(typeof navigator !== 'undefined' && navigator.msSaveBlob) return navigator.msSaveBlob(blob, fname);
		/*:: declare var saveAs: any; */
		if(typeof saveAs !== 'undefined') return saveAs(blob, fname);
		if(typeof URL !== 'undefined' && typeof document !== 'undefined' && document.createElement && URL.createObjectURL) {
			var url = URL.createObjectURL(blob);
			/*:: declare var chrome: any; */
			if(typeof chrome === 'object' && typeof (chrome.downloads||{}).download == "function") {
				if(URL.revokeObjectURL && typeof setTimeout !== 'undefined') setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
				return chrome.downloads.download({ url: url, filename: fname, saveAs: true});
			}
			var a = document.createElement("a");
			if(a.download != null) {
				/*:: if(document.body == null) throw new Error("unreachable"); */
				a.download = fname; a.href = url; document.body.appendChild(a); a.click();
				/*:: if(document.body == null) throw new Error("unreachable"); */ document.body.removeChild(a);
				if(URL.revokeObjectURL && typeof setTimeout !== 'undefined') setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
				return url;
			}
		}
	}
	// $FlowIgnore
	if(typeof $ !== 'undefined' && typeof File !== 'undefined' && typeof Folder !== 'undefined') try { // extendscript
		// $FlowIgnore
		var out = File(fname); out.open("w"); out.encoding = "binary";
		if(Array.isArray(payload)) payload = a2s(payload);
		out.write(payload); out.close(); return payload;
	} catch(e) { if(!e.message || !e.message.match(/onstruct/)) throw e; }
	throw new Error("cannot save file " + fname);
}

/* read binary data from file */
function read_binary(path/*:string*/) {
	if(typeof _fs !== 'undefined') return _fs.readFileSync(path);
	if(typeof Deno !== 'undefined') return Deno.readFileSync(path);
	// $FlowIgnore
	if(typeof $ !== 'undefined' && typeof File !== 'undefined' && typeof Folder !== 'undefined') try { // extendscript
		// $FlowIgnore
		var infile = File(path); infile.open("r"); infile.encoding = "binary";
		var data = infile.read(); infile.close();
		return data;
	} catch(e) { if(!e.message || !e.message.match(/onstruct/)) throw e; }
	throw new Error("Cannot access file " + path);
}
