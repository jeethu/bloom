#!/usr/bin/python
import unittest
import random
import os
from bloom import BloomFilter, SimpleBloomFilter
import cPickle as pickle

class BaseBFTest(unittest.TestCase) :
    KLASS = None
    N = 500
    def get_filter( self, capacity, err ) :
        raise NotImplemented

    def test_all( self ) :
        filter = self.get_filter(self.N,0.1)
        print 'n=%s, m=%s,k=%s'%(self.N,filter.M,filter.K)
        print 'the filter would be ~ %f KB in size'%(filter.M/1024.0)
        ds = set([os.urandom(10) for x in xrange(self.N)])
        map(filter.add,ds)
        for x in ds :
            self.assertTrue(x in filter)
        self.assertFalse(filter.full())
        print "Max value in the filter is: %s"%(max(filter._filter))
        s = random.sample(ds,self.N/10)
        cnt = 0
        for x in s :
            filter.remove(x)
            self.assertFalse(x in filter, "%s"%cnt)
        for x in ds :
            filter.remove(x)
        self.assertTrue(filter.empty())

    def test_serialization( self ) :
        filter = self.get_filter(self.N,0.1)
        self._test_serialization(filter)
        self._test_pickling(filter)
        self._test_json(filter)
        for x in xrange(self.N) :
            filter.add(os.urandom(100))
        self._test_serialization(filter)
        self._test_pickling(filter)
        self._test_json(filter)

    def _test_serialization( self, filter ) :
        d = filter.serialize()
        print "serialized size: %s"%(len(d.get('filter',[])))
        nf = self.KLASS.unserialize(d)
        self.assertEqual(filter,nf)

    def _test_pickling( self, filter ) :
        s = pickle.dumps(filter)
        f1 = pickle.loads(s)
        self.assertEqual(filter,f1)

    def _test_json( self, filter ) :
        s = filter.toJSON()
        f1 = self.KLASS.fromJSON(s)
        self.assertEqual(filter,f1)

class TestBloomFilter(BaseBFTest) :
    KLASS = BloomFilter
    def get_filter( self, capacity, err ) :
        m,k = SimpleBloomFilter.calc_mk( capacity, err )
        return self.KLASS( m, k )

class TestSimpleBloomFilter(BaseBFTest) :
    KLASS = SimpleBloomFilter
    def get_filter( self, capacity, err ) :
        return self.KLASS( capacity, err )

del BaseBFTest

if __name__ == '__main__' :
    unittest.main()
