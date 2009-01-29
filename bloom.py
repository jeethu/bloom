# -*- coding: utf-8 -*-
'''
A simple counting bloom filter implementation using the MD5 hash function.
-- Jeethu Rao <jeethu@jeethurao.com>
'''
import array
import hashlib
import os
import itertools
import math

class BloomFilter( object ) :
    M = 16384
    K = 8
    HASH_ALGO = 'md5'
    def __init__( self, m=None, k=None, ivs=None, value=None ) :
        if m is not None :
            self.M = m
        if k is not None :
            self.K = k
        if value is not None :
            self._filter = array.array('B',value)
            l = len(self._filter)
            if l < self.M :
                self._filter.extend(itertools.repeat(0,self.M-l))
        else :
            self._filter = array.array('L',itertools.repeat(0,self.M))
        n_bits = int(math.floor(math.log(self.M,2)))
        self.n_bytes = int(math.ceil(n_bits/8.0))
        self.digest_size = hashlib.new(self.HASH_ALGO).digest_size
        if ivs is None :
            self.ivs = [os.urandom(16) for x in
                        range((self.n_bytes*self.K/self.digest_size)-1)]
            self.ivs.insert(0,'')
        else :
            self.ivs = ivs

    def hash( self, d ) :
        l = []
        h_l,l = [], []
        for iv in self.ivs :
            h = hashlib.new(self.HASH_ALGO,iv)
            h.update(d)
            h_l.append(h.digest())
        hashes = ''.join(h_l)
        pos = 0
        for x in range(self.K) :
            v = 0
            for n,x in enumerate(hashes[pos:pos+self.n_bytes]) :
                v += ord(x) << (n*8)
            l.append(v%self.M)
            pos += self.n_bytes
        return l

    def full( self ) :
        return sum(bool(x) for x in self._filter) == self.M

    def empty( self ) :
        return sum(bool(x) for x in self._filter) == 0

    def __nonzero__( self ) :
        return not self.empty()

    def add( self, value ) :
        hash = self.hash(value)
        if all(self._filter[x] for x in hash) :
            return
        for x in hash :
            self._filter[x] += 1
            if self._filter[x] == 0 :   # Prevent overflow
                self._filter[x] -= 1

    def _remove( self, value, hash, cnt=0 ) :
        for x in hash :
            if self._filter[x] :
                self._filter[x] -= 1
        # Check if the value is still present
        if cnt > 5 :
            raise RuntimeError, "Can't remove the element from this filter"
        if all(self._filter[x] for x in hash) :  
            return self._remove( value, hash, cnt+1 )
        return True

    def remove( self, value ) :
        hash = self.hash(value) 
        return self._remove( value, hash )
        
    def __contains__( self, value ) :
        return all(self._filter[x] for x in self.hash(value))

    def serialize( self ) :
        d = {
            'm'      : self.M,
            'k'      : self.K,
        }
        min_val = min(self._filter)
        cfilter = [x-min_val for x in self._filter.tolist()]
        if any(cfilter) :
            d['filter'] = cfilter
        if min_val :
            d['min_val'] = min_val
        if any(self.ivs) :
            d['ivs'] = self.ivs
        return d

    @classmethod
    def unserialize( cls, d ) :
        min_val = d.get('min_val',0)
        filter = [x+min_val for x in d.get('filter',[])]
        if not filter :
            filter = None
        ivs = d.get('ivs',[''])
        return cls( d['m'],d['k'],ivs,filter )

class SimpleBloomFilter(BloomFilter) :
    def __init__( self, capacity=100, err=0.1, ivs=None, value=None ) :
        '''
        @capacity: The capacity of the filter
        @err: The tolerable false positives rate ( 0 < err < 0.5 )
        '''
        m = int(math.ceil(capacity * math.log(err) / math.log(1.0 / 2**math.log(2))))
        k = int(math.floor(math.log(2) * m / capacity))
        BloomFilter.__init__( self, m, k, ivs, value )
