(function() {
    BloomFilter.prototype.sha256 = sha256_digest;

    function bloomTestSuite() {
        // List of most common words from Wikipedia 
        // (http://en.wikipedia.org/wiki/Most_common_words_in_English)
        var english_words =
            [ "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for",
            "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by",
            "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all",
            "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get",
            "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him",
            "know", "take", "person", "into", "year", "your", "good", "some", "could", "them",
            "see", "other", "than", "then", "now", "look", "only", "come", "its", "over",
            "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", 
            "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", 
            "most", "us" ];
        var data = {"filter": [["0", 153], "10000100001", ["0", 35], "1", ["0", 34], "10000001", ["0", 238]], "k": 3, "m": 480};

        function testUnrle() {
            var rle_data = [["A", 17], ["B", 8], "CCCCCC", ["D", 10], "EEEEEEEkjlfdkfkf", ["1", 8], "233333344444445555555"];
            data = 'AAAAAAAAAAAAAAAAABBBBBBBBCCCCCCDDDDDDDDDDEEEEEEEkjlfdkfkf11111111233333344444445555555';
            var decoded = BloomFilter.unrle(rle_data);
            assertEquals(decoded,data);
        }

        function testHash() {
            var bf = new BloomFilter(data);
            var h = bf.hash('Jeethu Rao');
            var l = [12,133,45];
            assertEquals(h.length,l.length);
            for(var i=0;i<l.length;i++) {
                assertEquals(h[i],l[i]);
            }
        }

        function testBloom() {
            var bf = new BloomFilter( data );
            var i=0;
            assertEquals(bf.empty(),false);
            bf.add('Jeethu Rao');
            assertEquals(bf.hasKey('Jeethu Rao'),true);
            bf.remove('Jeethu Rao');
            assertEquals(bf.hasKey('Jeethu Rao'),false);
        }

        function testBloomAdd() {
            var bf = new BloomFilter({'filter':'','k':3,'m':400});
            assertEquals(bf.empty(),true);
            var l = english_words;
            for(i=0;i<l.length;i++) {
                bf.add(l[i]);
            }
            assertEquals(bf.empty(),false);
            for(i=0;i<l.length;i++) {
                assertEquals(bf.hasKey(l[i]),true);
            }
            for(i=0;i<l.length;i++) {
                bf.remove(l[i]);
            }
            for(i=0;i<l.length;i++) {
                assertEquals(bf.hasKey(l[i]),false);
            }
            assertEquals(bf.empty(),true);
        }
    }
    jsUnity.log = function(s) { 
        var node = document.createElement('div');
        node.innerHTML = s;
        document.body.appendChild(node);
    };
    jsUnity.error = function(s) {
        var node = document.createElement('div');
        node.style.color = 'red';
        node.innerHTML = s;
        document.body.appendChild(node);
    };
    var results = jsUnity.run(bloomTestSuite);
})();

