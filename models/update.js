module.exports = (sequelize, DataTypes) => {
  const Update = sequelize.define('Update', {
    counter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    status: DataTypes.STRING,
    success: DataTypes.BOOLEAN,
    fileDate: DataTypes.DATE,
    fileUrl: DataTypes.STRING
  }, {
    indexes: [
      { unique: true, fields: ['counter'] },
      { fields: ['status'] },
      { fields: ['success'] },
      { fields: ['fileDate'] },
    ]
  });

  return Update;
};
