import { useColorMode } from "@docusaurus/theme-common";

export default function ThemedIframe({ githubUrl}) {
  const { colorMode } = useColorMode();

  const styleParam = colorMode === "dark" ? "androidstudio" : "xcode";

  const encodedTarget = encodeURIComponent(githubUrl);

  const baseSrc = `https://emgithub.com/iframe.html?target=${encodedTarget}&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on`;

  const src = `${baseSrc}&style=${styleParam}`;

  return (
    <iframe
      src={src}
      style={{
        width: "100%",
        borderRadius: "8px",
      }}
    />
  );
}
