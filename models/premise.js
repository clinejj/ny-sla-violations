module.exports = (sequelize, DataTypes) => {
  const Premise = sequelize.define('Premise', {
    licenseId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    name: DataTypes.STRING,
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: DataTypes.STRING,
    longitude: DataTypes.STRING
  }, {
    indexes: [
      { unique: true, fields: ['licenseId'] },
      { fields: ['name'] },
      { fields: ['city'] },
    ]
  });

  return Premise;
};