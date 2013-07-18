module.exports = function(sequelize, DataTypes) {
  return sequelize.define('XRayGoggleMix', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // webmaker id for the person whose project this is
    userid: {
      type: DataTypes.STRING,
      validate: { notEmpty: true }
    },
    // url for this published project
    url: {
      type: DataTypes.STRING
    },
    // which page did this remix?
    remixedFrom: {
      type: DataTypes.STRING,
      validate: { notEmpty: false }
    },
    // the raw remix data
    data: {
      type: DataTypes.TEXT,
      validate: { notEmpty: true }
    }
  },{
    // let Sequelize handle timestamping
    timestamps: true,
    // content is unicode.
    charset: 'utf8',
    // content is definitely unicode.
    collate: 'utf8_general_ci'
  });
};
