module.exports = (sequelize, DataTypes) => {
  const Suspension = sequelize.define('Suspension', {
    licenseId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    name: DataTypes.STRING,
    county: DataTypes.STRING,
    suspended: DataTypes.BOOLEAN,
    status: DataTypes.STRING,
    dateImposed: DataTypes.DATEONLY
  }, {
    indexes: [
      { unique: true, fields: ['licenseId'] },
      { fields: ['name'] },
      { fields: ['county'] },
      { fields: ['status'] },
      { fields: ['suspended'] },
    ]
  });

  return Suspension;
};
