const typeSuffixConfig = {
  "file-text": [".txt"],
  "file-html": [".html"],
  "file-mp3": [".mp3", ".wma", ".ape", ".wav", ".cda"],
  "file-mp4": [".mp4", ".m4v", ".avi", ".flv", ".mpeg", ".mpg", ".vob"],
  "file-pdf": [".pdf"],
  "file-excel": ['.xls', '.xlsx', '.xlsm', '.xltx', '.xltm', '.xlsb', '.xlam'],
  "file-ppt": ['.ppt', '.pptx', '.pptm', '.ppsx', '.ppsm', '.potx', '.potm', '.ppam'],
  "file-word": ['.doc', '.docx', '.docm', '.dotx', '.dotm'],
  "file-zip": [".zip", ".7z"],
  "file-picture": [".png", ".jpg", ".jpeg"],
};

const suffixTypeConfig = new Map()
for (let type in typeSuffixConfig) {
  let suffixes = typeSuffixConfig[type];
  suffixes.forEach((suffix) => {
    suffixTypeConfig.set(suffix, type)
  })
}

const unknownIcon = "file-unknown";

export function getFileType(filename) {
  let separatorIdx = filename.lastIndexOf('.');
  if (separatorIdx < 0) {
    return unknownIcon;
  }
  let suffix = filename.substring(separatorIdx, filename.length).toLowerCase();
  let type = suffixTypeConfig.get(suffix);
  return type == null ? unknownIcon : type;
}

export function isPicture(filename) {
  return getFileType(filename) === 'file-picture'
}
