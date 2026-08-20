"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const softwares = await queryInterface.describeTable("softwares").catch(() => null);
    if (softwares?.icon) {
      await queryInterface.changeColumn("softwares", "icon", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    const services = await queryInterface.describeTable("services").catch(() => null);
    if (services?.icon) {
      await queryInterface.changeColumn("services", "icon", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const softwares = await queryInterface.describeTable("softwares").catch(() => null);
    if (softwares?.icon) {
      await queryInterface.changeColumn("softwares", "icon", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    const services = await queryInterface.describeTable("services").catch(() => null);
    if (services?.icon) {
      await queryInterface.changeColumn("services", "icon", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
  },
};
