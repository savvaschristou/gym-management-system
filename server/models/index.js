'use strict';

/**
 * Sequelize models: one class per table, and the relationships between them.
 *
 * Attribute names are camelCase in JavaScript (userId, displayName) and map to
 * the snake_case columns in the database (user_id, display_name) through
 * `underscored: true`. Validations repeat the database's CHECK constraints, so
 * bad data is caught with a clear message before it even reaches SQLite.
 *
 * Usage:
 *   const { User, Membership } = require('./models');
 *   const user = await User.findOne({ where: { email }, include: Membership });
 */
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js').development;

const sequelize = new Sequelize(config);
const common = { underscored: true, timestamps: false };
const id = (column) => ({ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: column });

const User = sequelize.define(
  'User',
  {
    userId: id('user_id'),
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    displayName: { type: DataTypes.STRING(100), allowNull: false },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [['member', 'staff']] } },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { ...common, tableName: 'users' }
);

const MembershipPlan = sequelize.define(
  'MembershipPlan',
  {
    planId: id('plan_id'),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    durationDays: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    graceDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { ...common, tableName: 'membership_plans' }
);

const Membership = sequelize.define(
  'Membership',
  {
    membershipId: id('membership_id'),
    userId: { type: DataTypes.INTEGER, allowNull: false },
    planId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    state: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'frozen', 'cancelled']] },
    },
  },
  {
    ...common,
    tableName: 'memberships',
    validate: {
      endsAfterStart() {
        if (this.endDate < this.startDate) throw new Error('endDate must be on or after startDate');
      },
    },
  }
);

const CheckIn = sequelize.define(
  'CheckIn',
  {
    checkInId: id('check_in_id'),
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    checkedInAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { ...common, tableName: 'check_ins' }
);

const Exercise = sequelize.define(
  'Exercise',
  {
    exerciseId: id('exercise_id'),
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    muscleGroup: { type: DataTypes.STRING(50), allowNull: false },
  },
  { ...common, tableName: 'exercises' }
);

const WorkoutSession = sequelize.define(
  'WorkoutSession',
  {
    sessionId: id('session_id'),
    userId: { type: DataTypes.INTEGER, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT },
  },
  { ...common, tableName: 'workout_sessions' }
);

const LiftSet = sequelize.define(
  'LiftSet',
  {
    setId: id('set_id'),
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
    exerciseId: { type: DataTypes.INTEGER, allowNull: false },
    setNumber: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    weightLbs: { type: DataTypes.DECIMAL(6, 2), allowNull: false, validate: { min: 0 } },
    reps: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  },
  { ...common, tableName: 'lift_sets' }
);

// Relationships (cardinality as in the ER diagram)
User.hasMany(Membership, { foreignKey: 'userId' }); // 1 user : 0..* memberships
Membership.belongsTo(User, { foreignKey: 'userId' });
MembershipPlan.hasMany(Membership, { foreignKey: 'planId' }); // 1 plan : 0..* memberships
Membership.belongsTo(MembershipPlan, { foreignKey: 'planId' });

User.hasMany(CheckIn, { as: 'checkIns', foreignKey: 'memberId' }); // a member's visits
User.hasMany(CheckIn, { as: 'checkInsRecorded', foreignKey: 'staffId' }); // visits a staff member let in
CheckIn.belongsTo(User, { as: 'member', foreignKey: 'memberId' });
CheckIn.belongsTo(User, { as: 'staff', foreignKey: 'staffId' });

User.hasMany(WorkoutSession, { foreignKey: 'userId' }); // 1 user : 0..* sessions
WorkoutSession.belongsTo(User, { foreignKey: 'userId' });
WorkoutSession.hasMany(LiftSet, { as: 'sets', foreignKey: 'sessionId' }); // 1 session : 0..* sets
LiftSet.belongsTo(WorkoutSession, { foreignKey: 'sessionId' });
Exercise.hasMany(LiftSet, { foreignKey: 'exerciseId' }); // 1 exercise : 0..* sets
LiftSet.belongsTo(Exercise, { foreignKey: 'exerciseId' });

module.exports = { sequelize, User, MembershipPlan, Membership, CheckIn, Exercise, WorkoutSession, LiftSet };
