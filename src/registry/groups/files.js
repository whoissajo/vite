import { Archive, Fingerprint, FolderArchive } from 'lucide-react';

export default [
  { id: 'zip-create', name: "Create ZIP", tagline: "Bundle files into a ZIP archive with real compression.", description: "Choose compression level; shows the actual size saved. Nothing is uploaded.", group: 'files', icon: Archive, keywords: ["compress", "archive", "bundle", "zip files"], popular: true, load: () => import('../../tools/files/ZipCreate.jsx') },
  { id: 'zip-extract', name: "Extract ZIP", tagline: "Open a ZIP, browse its contents and save files.", description: "Browse entries, download individual files, or re-zip.", group: 'files', icon: FolderArchive, keywords: ["unzip", "open zip", "extract", "unpack"], popular: true, load: () => import('../../tools/files/ZipExtract.jsx') },
  { id: 'file-hash', name: "File Hash & Checksum", tagline: "MD5, SHA-1, SHA-256, SHA-512 for any file or text.", description: "Verify downloads by comparing against a known checksum.", group: 'files', icon: Fingerprint, keywords: ["checksum", "md5", "sha256", "integrity", "verify"], load: () => import('../../tools/files/FileHash.jsx') },
];
