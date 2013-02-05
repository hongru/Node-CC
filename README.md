# NodeCC

compress & combo js files

### Usage
<pre>npm install -g nodecc</pre>
<pre>
nodecc ./static/
</pre>
defaults dir `'./'`

- need `.nodecc` file to config, file `.nodecc` looks like this:
<pre>
{
    "encode": "utf8",
    "cc": [
        {
            "source": "tests/test.js",
            "target": "tests/test.min.js"
        },
        {
            "source": "tests/js/",
            "target": "tests/public/js/"
        },
        {
            "source": [
                "!|tests/licence.js",
                "tests/a.js",
                "tests/b.js"
            ],
            "target": "test/public/js/ab.js"
        }
    ]
}
</pre>

- if you just want to merge a file with no-compressed, you can add `!|` before js file. just like `!|tests/licence.js` 
