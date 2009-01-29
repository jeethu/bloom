import unittest
import random
import os
from bloom import BloomFilter, SimpleBloomFilter

class TestBloomFilter(unittest.TestCase) :
    def test_all( self ) :
        N = 10000
        filter = SimpleBloomFilter(N,0.1)
        print 'n=%s, m=%s,k=%s'%(N,filter.M,filter.K)
        print 'the filter would be ~ %f KB in size'%(filter.M/1024.0)
        ds = set([os.urandom(10) for x in xrange(N)])
        map(filter.add,ds)
        for x in ds :
            self.assertTrue(x in filter)
        self.assertFalse(filter.full())
        s = random.sample(ds,N/10)
        cnt = 0
        for x in s :
            filter.remove(x)
            self.assertFalse(x in filter, "%s"%cnt)
        for x in ds :
            filter.remove(x)
        self.assertTrue(filter.empty())

if __name__ == '__main__' :
    unittest.main()
