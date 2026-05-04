# brat Sticker Bot

With that bot, you can create brat stickers with /b command. You can use bot from [this link](https://t.me/brat_sticker_bot) directly. Also if you want to contribute source code, you can send pull request from this repository.

## Adding Translations

For adding translations, copy the source file `locales/en.json` with your [ISO language code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) into same directory (like `locales/tr.json`)

When you finish the translation, you need to add language field into `utils/languages.ts` file.

```ts
export default [
    { code: "en", flag: "🇺🇸", display: "English" },
    { code: "tr", flag: "🇹🇷", display: "Türkçe" },
    // other languages
    { code: "lang_code", flag: "FLAG_EMOTE", display: "DISPLAY"}
]
```

Firstly you need to paste your country flag into flag field, then write your language name in your language (for example Turkish means Türkçe in Turkish). Then send a pull request :)

## Contributions

Feel free to make contributions into source code, I created this project for fun, so you can add crazy things if you want too 😊

## The End

Developed by [mamiiblt](https://github.com/mamiiblt) for fun. If you want to make feedback about bot or report a issue, contact me via [support group](https://t.me/brat_support_group) of the bot.
