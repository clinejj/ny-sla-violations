module.exports = (sequelize, DataTypes) => {
  const Violation = sequelize.define('Violation', {
    licenseId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'licenseDateId',
      primaryKey: true
    },
    chargeDate: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: 'licenseDateId',
      primaryKey: true
    },
    county: DataTypes.STRING,
    licenseType: DataTypes.STRING,
    premiseName: DataTypes.STRING,
    premiseCity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    premiseAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    violationDescription: DataTypes.STRING
  }, {
    indexes: [
      { unique: true, fields: [ 'licenseId', 'chargeDate' ] },
      { fields: ['licenseId'] },
      { fields: ['chargeDate'] },
      { fields: ['violationDescription'] },
      { fields: ['county'] },
      { fields: ['premiseCity'] }
    ]
  });

  return Violation;
};