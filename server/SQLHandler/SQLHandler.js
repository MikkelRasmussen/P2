var pg = require('pg');
//https://www.w3schools.com/nodejs/nodejs_mysql.asp
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
//https://stackoverflow.com/questions/9205496/how-to-make-connection-to-postgres-via-node-js
module.exports = class SQLHandler {
    #client;
    async Connect(host, user, password, port) {
        var conString = `postgres://${user}:${password}@${host}:${port}/FoodDB`;

        this.#client = new pg.Client(conString);

        try {
            await this.#client.connect();
            console.log("Connected to SQL Database!")


            this.#client.on("error", (err) => {
                console.err(err);
            });
            this.#client.on('notification', (msg) => {
                console.log(msg.channel) // foo
                console.log(msg.payload) // bar!
            });
            this.#client.on("end", () => {
                console.warn("Client disconnected!");
            })

        } catch (error) {
            console.error("Could not connect to SQL Database!");
        }
    }
    async Disconnect(){
        await this.#client.end();
        console.log("Client disconnected!");
    }
    /**
     * Sends a SQL query to the SQL database and returns a table of data.
     * @param   query  The SQL query in the format of a string.
     * @returns data table, or undefined on an error
     */
    async Query(query) {
        try {
            const result = await this.#client.query(query);
            return result.rows;
        } catch (error) {
            console.error("Could not query!");
            console.error(error);
        }
    }
}
