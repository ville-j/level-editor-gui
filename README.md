#### How to run
To run this project you need to have [budo](https://github.com/mattdesl/budo) installed:
```
npm install budo -g
```
Then as usual you can run
```
npm install
npm start
```

You need to have the [level-editor-server](https://github.com/ville-j/level-editor-server) running
in order to edit levels in "rooms" with people.

#### Usage
```
var editor = new LevelEditorGUI({
  element: "level-editor"
});
```
You can pass an object to the constructor with the following options:
```
element       id of the dom element where the editor will be appended
server        address of the server you want to connect to (if any)
toolbar       you can set this to false if you don't want the toolbar to be visible
colors        customize editor color profile
```

#### Customizing colors
Pass an object to colors option, e.g.
```
var editor = new LevelEditorGUI({
  element: "level-editor",
  colors: {
      apple: "#dc0000",
      edges: "#db0855",
      flower: "#eaeaea",
      ground: "#181048",
      killer: "#080808",
      selectBox: "#ffffff",
      selection: "#ff7b2e",
      sky: "#3078bc",
      start: "#309c30",
      toolbar: "#131313"
    }
});
