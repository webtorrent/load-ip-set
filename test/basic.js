var fs = require('fs')
var http = require('http')
var loadIPSet = require('../')
var path = require('path')
var test = require('tape')
var zlib = require('zlib')

test('array of IPs', function (t) {
  t.plan(5)
  loadIPSet([ '1.2.3.4' ], function (err, ipSet) {
    if (err) throw err
    t.ok(ipSet.contains('1.2.3.4'))
    t.ok(!ipSet.contains('1.1.1.1'))
  })
  loadIPSet([ '1.2.3.4', '5.6.7.8' ], function (err, ipSet) {
    if (err) throw err
    t.ok(ipSet.contains('1.2.3.4'))
    t.ok(ipSet.contains('5.6.7.8'))
    t.ok(!ipSet.contains('1.1.1.1'))
  })
})

function checkList (t, ipSet) {
  t.ok(ipSet.contains('1.2.3.0'))
  t.ok(ipSet.contains('1.2.3.1'))
  t.ok(ipSet.contains('1.2.3.254'))
  t.ok(ipSet.contains('1.2.3.255'))
  t.ok(ipSet.contains('5.6.7.0'))
  t.ok(ipSet.contains('5.6.7.128'))
  t.ok(ipSet.contains('5.6.7.255'))
  t.ok(ipSet.contains('192.168.1.1'))
  t.ok(ipSet.contains('192.168.1.230'))
  t.ok(ipSet.contains('192.168.1.100'))
  t.ok(!ipSet.contains('192.168.1.231'))
  t.ok(ipSet.contains('192.168.1.240'))
  t.ok(!ipSet.contains('192.168.1.241'))
  t.ok(!ipSet.contains('1.1.1.1'))
  t.ok(!ipSet.contains('2.2.2.2'))
}

test('array of IP ranges', function (t) {
  t.plan(15)
  loadIPSet([
    { start: '1.2.3.0', end: '1.2.3.255' },
    { start: '5.6.7.0', end: '5.6.7.255' },
    { start: '192.168.1.1', end: '192.168.1.230' },
    { start: '192.168.1.240', end: '192.168.1.240' }
  ], function (err, ipSet) {
    if (err) throw err
    checkList(t, ipSet)
  })
})

test('http url', function (t) {
  t.plan(15)
  var server = http.createServer(function (req, res) {
    fs.createReadStream(path.join(__dirname, 'list.txt'))
      .pipe(res)
  })
  server.listen(0, function () {
    var url = 'http://127.0.0.1:' + server.address().port
    loadIPSet(url, function (err, ipSet) {
      if (err) throw err
      checkList(t, ipSet)
      server.close()
    })
  })
})

test('http url (with custom user agent)', function (t) {
  t.plan(16)
  var server = http.createServer(function (req, res) {
    t.equal(req.headers['user-agent'], 'WebTorrent (http://webtorrent.io)')
    fs.createReadStream(path.join(__dirname, 'list.txt'))
      .pipe(res)
  })
  server.listen(0, function () {
    var url = 'http://127.0.0.1:' + server.address().port
    loadIPSet(url, {
      headers: { 'user-agent': 'WebTorrent (http://webtorrent.io)' }
    }, function (err, ipSet) {
      if (err) throw err
      checkList(t, ipSet)
      server.close()
    })
  })
})

test('http url with gzip encoding', function (t) {
  t.plan(15)
  var server = http.createServer(function (req, res) {
    res.setHeader('content-encoding', 'gzip')
    fs.createReadStream(path.join(__dirname, 'list.txt'))
      .pipe(zlib.createGzip())
      .pipe(res)
  })
  server.listen(0, function () {
    var url = 'http://127.0.0.1:' + server.address().port
    loadIPSet(url, function (err, ipSet) {
      if (err) throw err
      checkList(t, ipSet)
      server.close()
    })
  })
})

test('http url with deflate encoding', function (t) {
  t.plan(15)
  var server = http.createServer(function (req, res) {
    res.setHeader('content-encoding', 'deflate')
    fs.createReadStream(path.join(__dirname, 'list.txt'))
      .pipe(zlib.createDeflate())
      .pipe(res)
  })
  server.listen(0, function () {
    var url = 'http://127.0.0.1:' + server.address().port
    loadIPSet(url, function (err, ipSet) {
      if (err) throw err
      checkList(t, ipSet)
      server.close()
    })
  })
})

test('fs path', function (t) {
  t.plan(15)
  loadIPSet(path.join(__dirname, 'list.txt'), function (err, ipSet) {
    if (err) throw err
    checkList(t, ipSet)
  })
})

test('fs path with gzip', function (t) {
  t.plan(15)
  loadIPSet(path.join(__dirname, 'list.txt.gz'), function (err, ipSet) {
    if (err) throw err
    checkList(t, ipSet)
  })
})
