/*
 * A Bloom filter in Javascript
 * 100% compatible with the python implementation.
 */
(function() {
    function unrle(s) {
        var el;
        var l = [];
        if(typeof s === "string") {
            return s;
        }
        for(var i=0,it=s.length;i<it;i++) {
            el = s[i];
            if(typeof el === "string") {
                l.push(el);
            } else {
                var r = [],c=el[0];
                for(var x=el[1];x>0;x--) {
                    r.push(c);
                }
                l.push(r.join(''));
            }
        }
        return l.join('');
    }

    var _HEX_MAP = function(){
        var l = '0123456789ABCDEF';
        var d = {};
        for(var i=0;i<l.length;i++) {
            d[l[i]] = i;
        }
        return d;
    }();

    function BloomFilter( d ) {
        if(d.hasOwnProperty('m')) {
            this.m = d.m;
        } else {
            this.m = 16384;
        }
        if(d.hasOwnProperty('k')) {
            this.k = d.k;
        } else {
            this.k = 8;
        }
        if(d.hasOwnProperty('ivs')) {
            this.ivs = d.ivs;
        } else {
            this.ivs = [''];
        }
        var filter = [];
        var i;
        if(d.hasOwnProperty('filter')&&d.filter) {
            var min_value = d.hasOwnProperty('min_val') ? d.min_val : 0;
            var data = unrle(d.filter);
            var data_len = data.length;
            if(data_len==this.m) {
                // 4 bits per value
                for(i=0;i<data_len;i++) {
                    filter.push(min_value + _HEX_MAP[data[i]]);
                }
            } else if(data_len==(this.m<<1)) {
                // 8 bits per value
                var val = 0;
                var state = 0;
                for(i=0;i<data_len;i++) {
                    if(state===0) {
                        val = _HEX_MAP[data[i]] << 4;
                    } else {
                        val += _HEX_MAP[data[i]];
                        filter.push(min_value + _HEX_MAP[data[i]]);
                    }
                    state = (state+1) & 1;
                }
            } else {
                throw "Error, incorrect filter len: " + data_len.toString();
            }
        } else {
            for(i=0;i<this.m;i++) {
                filter.push(0);
            }
        }
        this.filter = filter;
        this.calc_nbytes();
    }

    BloomFilter.prototype.calc_nbytes = function() {
        var n_bits = Math.floor(Math.LOG2E * Math.log(this.m));
        this.n_bytes = Math.ceil(n_bits/8.0);
    };

    // BloomFilter.prototype.sha256 = ???;

    BloomFilter.prototype.hexToInt = function( s ) {
        var v = 0;
        var a = s.split('');
        a.reverse();
        for(var i=0,j=s.length;i<j;i++) {
            v += _HEX_MAP[a[i]] << (i<<2);
        }
        return (v%this.m);
    };

    BloomFilter.prototype.hash = function( s ) {
        var l = [], h_l = [], i,j,hashes,v,pos=0;
        for(i=0,j=this.ivs.length;i<j;i++) {
            h_l.push(this.sha256(this.ivs[i] + s ));
        }
        hashes = h_l.join('').toUpperCase();
        for(i=0,j=this.k;i<j;i++) {
            l.push(this.hexToInt(hashes.slice(pos,pos+(this.n_bytes<<1))));
            pos += this.n_bytes<<1;
        }
        return l;
    };

    BloomFilter.prototype.hasKey = function( s ) {
        var cnt=0;
        var h = this.hash(s);
        for(var i=0,j=h.length;i<j;i++) {
            if(!this.filter[h[i]]) {
                return false;
            }
        }
        return true;
    };

    BloomFilter.prototype.add = function( value ) {
        var hash = this.hash(value), filter=this.filter,i=0,j=hash.length,cnt=0;
        for(;i<j;i++) {
            if(filter[hash[i]]) {
                cnt += 1;
            } else {
                break;
            }
        }
        if(cnt==j) {
            return;
        }
        for(i=0;i<j;i++) {
            filter[hash[i]] += 1;
        }
    };

    BloomFilter.prototype._remove = function( hash, cnt ) {
        var i=0,j = hash.length, filter=this.filter;
        for(;i<j;i++) {
            if(filter[hash[i]]) {
                filter[hash[i]] -= 1;
            }
        }
        if(cnt>5) {
            throw "Can't remove element from this filter";
        }
        for(i=0;i<j;i++) {
            if(!filter[hash[i]]) {
                return true;
            }
        }
        return this._remove( hash, cnt+1 );
    };

    BloomFilter.prototype.remove = function( value ) {
        var hash = this.hash(value);
        return this._remove( hash, 0 );
    };

    function _filter_sum( that ) {
        var s=0,filter=that.filter;
        for(var i=0,j=that.m;i<j;i++) {
            if(filter[i]) {
                s+=1;
            }
        }
        return s;
    };

    BloomFilter.prototype.empty = function() {
        return _filter_sum(this)==0;
    };

    BloomFilter.prototype.full = function() {
        return _filter_sum(this)==this.m;
    };

    BloomFilter.unrle = unrle;

    window.BloomFilter = BloomFilter;
})();
