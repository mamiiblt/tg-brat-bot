interface PageValues {
    text: string;
    blurAmount: number;
    theme: {
        backgroundHex: string;
        textHex: string;
        boxPadding: number;
    }
    font: {
        base64: string;
        familyName: string;
        size: number;
        weight: number;
        lineHeight: number;
        textAlign: string;
        alignItems: string;
    }
}

export const defaultPageConfig = {
    blurAmount: 3,
    lineHeight: 1,
    fontSize: 185,
    fontWeight: 700,
}

export function createBratPage(pageData: PageValues): string {
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
                            padding: ${pageData.theme.boxPadding + "px"};
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
                            font-size: ${pageData.font.size + "px"};
                            line-height: ${pageData.font.lineHeight};
                            text-align: ${pageData.font.textAlign};
                            white-space: pre-wrap;
                            color: ${pageData.theme.textHex};
                            filter: blur(${pageData.blurAmount}px);
                            overflow-wrap: break-word;
                            word-wrap: break-word;
                        }
                    </style>
                </head>

                <body>
                    <div id="bratBox">
                        <div id="display">${pageData.text}</div>
                    </div>

                    <script>
                        window.addEventListener('DOMContentLoaded', (event) => {
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
            </html>`
}