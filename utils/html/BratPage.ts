interface PageValues {
    text: string;

    blurAmount: number;

    theme: {
        backgroundHex: string;
        textHex: string;
        boxPadding: number;
    };

    font: {
        base64: string;
        familyName: string;
        size: number;
        weight: number;
        lineHeight: number;
        textAlign: string;
        alignItems: string;
    };

    scribble: {
        isEnabled: boolean;
        fileBase64: string;
    };
}

export const defaultPageConfig = {
    blurAmount: 4,
    lineHeight: 1,
    fontSize: 180,
    fontWeight: 800,
};

export function createBratPage(pageData: PageValues): string {
    const scribble = pageData.scribble.isEnabled
        ? `
            <img
                id="scribble"
                src="data:image/png;base64,${pageData.scribble.fileBase64}"
                alt=""
            />
        `
        : "";

    return `
        <!doctype html>

        <html lang="tr">
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width,initial-scale=1"/>

                <style>
                    @font-face {
                        font-family: "${pageData.font.familyName}";
                        src: url("data:font/ttf;base64,${pageData.font.base64}") format("truetype");
                        font-weight: 700;
                        font-style: normal;
                        font-display: block;
                    }

                    html, body {
                        width: 1000px;
                        height: 1000px;
                        margin: 0;
                        overflow: hidden;
                        background: #ffffff;
                    }

                    #bratBox {
                        width: 1000px;
                        height: 1000px;
                        background: ${pageData.theme.backgroundHex};
                        position: relative;
                        overflow: hidden;
                        padding: ${pageData.theme.boxPadding}px;
                        box-sizing: border-box;
                        display: flex;
                    }

                    #display {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: ${pageData.font.alignItems};
                        justify-content: center;
                        font-family: "${pageData.font.familyName}";
                        font-weight: ${pageData.font.weight};
                        font-size: ${pageData.font.size}px;
                        line-height: ${pageData.font.lineHeight};
                        text-align: ${pageData.font.textAlign};
                        white-space: pre-wrap;
                        color: ${pageData.theme.textHex};
                        filter: blur(${pageData.blurAmount}px);
                        overflow-wrap: break-word;
                        word-wrap: break-word;
                        position: relative;
                        z-index: 1;
                    }

                    #scribble {
                        position: absolute;
                        inset: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        z-index: 2;
                        pointer-events: none;
                    }
                </style>
            </head>

            <body>
                <div id="bratBox">
                    <div id="display">${pageData.text}</div>

                    ${scribble}
                </div>

                <script>
                    window.addEventListener('DOMContentLoaded', () => {
                        const displayDiv = document.getElementById('display');

                        let fontSize = ${pageData.font.size};
                        const minFontSize = 10;

                        function isOverflowing() {
                            return displayDiv.scrollHeight > displayDiv.clientHeight ||
                                displayDiv.scrollWidth > displayDiv.clientWidth;
                        }

                        while (isOverflowing() && fontSize > minFontSize) {
                            fontSize -= 2;
                            displayDiv.style.fontSize = fontSize + 'px';
                        }
                    });
                </script>
            </body>
        </html>
    `;
}