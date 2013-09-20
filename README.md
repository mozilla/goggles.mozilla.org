X-ray goggles on Node.js
========================

This is a reboot of the xray goggles, so that it is served as a node app.

Migration
---------

Various scripts are present that will assist in migrating old data sets along with Node.js scripts to update old records.

* `migrations/09052013-add-makeid-column.sql`
    * Used to add the `makeid` to the `ThimbleProject` data model. Using the script will depend on your SQL managing environment, but here's an example of using it in a commandline prompt:
        * `mysql < migrations/09052013-add-makeid-column.sql` - Assumes you have already done `use <DB_NAME>`

* `migrations/ThimbleProjectMigration.js`
    * Used to retrieve the `makeid` for any `ThimbleProject` that has already been published to the **MakeAPI**. This only needs to be run once.
        * `node migrations/ThimbleProjectMakeIDMigration.js` will execute this script, assuming proper `.env` variables have already been setup (instructions above).
