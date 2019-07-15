const mongoose = require('mongoose');

const threeMonthSchema = mongoose.Schema({
    name: String,
    learningCurve: Number,
    personalityCurve: Number,
    performanceCurve: Number,
    totalAchivePoint: Number,
    badge: String,
    meetUpDeadline: Number,
    qualityOfWork: Number,
    extraResponsibility: Number,
    innovativeContribution: Number,
    customerHappiness: Number,
    preservingData: Number,
    productivity: Number,
    total1: Number,
    organizationBehaviour: Number,
    standUpAttendance: Number,
    avgWorkingHour: Number,
    helpsColleague: Number,
    communityEngagement: Number,
    total2: Number,
    knowledgeSharing: Number,
    domainKnowledge: Number,
    total3: Number,
    createdAt : { type : Date, default: Date.now }
})


module.exports = mongoose.model('ThreeMonth', threeMonthSchema);