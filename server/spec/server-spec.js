/* You'll need to have MySQL running and your Node server running
 * for these tests to pass. */

var mysql = require('mysql');
var request = require('request'); // You might need to npm install the request module!
var expect = require('chai').expect;

describe('Persistent Node Chat Server', function () {
  var dbConnection;

  beforeEach(function (done) {
    dbConnection = mysql.createConnection({
      user: 'root',
      password: '',
      database: 'chat',
      multipleStatements: true
    });
    dbConnection.connect();

    var tablename = "messages"; // TODO: fill this out

    /* Empty the db table before each test so that multiple tests
     * (or repeated runs of the tests) won't screw each other up: */
    dbConnection.query('truncate ' + tablename);
    done();
  });

  afterEach(function () {
    dbConnection.end();
  });

  it('Should insert posted messages to the DB', function (done) {
    // Post the user to the chat server.
    request({
      method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/users',
      json: { username: 'Valjean' }
    }, function () {
      // Post a message to the node chat server:
      request({
        method: 'POST',
        uri: 'http://127.0.0.1:3000/classes/messages',
        json: {
          username: 'Valjean',
          text: 'In mercy\'s name, three days is all I need.',
          roomname: 'Hello'
        }
      }, function () {
        // Now if we look in the database, we should find the
        // posted message there.

        // TODO: You might have to change this test to get all the data from
        // your message table, since this is schema-dependent.
        var queryString = 'SELECT * FROM messages';
        var queryArgs = [];

        dbConnection.query(queryString, queryArgs, function (err, results) {
          // Should have one result:
          expect(results.length).to.equal(1);

          // TODO: If you don't have a column named text, change this test.
          expect(results[0].msg).to.equal('In mercy\'s name, three days is all I need.');

          done();
        });

      });
    });
  });

  it('Should output all messages from the DB', function (done) {
    // Let's insert a message into the db

    // var queryString = "INSERT INTO rooms (roomname) VALUES ('main'); \
    //   INSERT INTO messages (msg, user_id, room_id) \
    //   VALUES ('Men like you can never change!', 1, id FROM rooms WHERE roomname = 'main');";

    dbConnection.query("INSERT IGNORE INTO rooms (roomname) VALUES ('main')");
    var queryString = "INSERT INTO messages (msg, user_id, room_id) VALUES ('Men like you can never change!', (SELECT users.id FROM users WHERE users.username = 'default'), (SELECT rooms.id FROM rooms WHERE rooms.roomname = 'main'));";


    var queryArgs = [];
    // TODO - The exact query string and query args to use
    // here depend on the schema you design, so I'll leave
    // them up to you. */

    // SQL to reset the auto_increment to 1 -- ALTER TABLE tablename AUTO_INCREMENT = 1

    dbConnection.query(queryString, queryArgs, function (err) {
      if (err) { throw err; }

      // Now query the Node chat server and see if it returns
      // the message we just inserted:
      request('http://127.0.0.1:3000/classes/messages', function (error, response, body) {
        var messageLog = JSON.parse(body);
        expect(messageLog.results[0].text).to.equal('Men like you can never change!');
        expect(messageLog.results[0].roomname).to.equal('main');
        done();
      });
    });
  });

  it('Should post user to the database', function (done) {
    request({
      method: 'POST',
      uri: 'http://127.0.0.1:3000/classes/users',
      json: { username: 'TESTUSER2' }
    }, function () {
      dbConnection.query('SELECT username FROM users', function(err, response) {
        var index = -1;

        response.forEach((element, i) => {
          if(element.username === 'TESTUSER2') {
            index = i;
          }
        });
        expect(index).to.not.equal(-1);
        done();
      })
    })
  });
});
