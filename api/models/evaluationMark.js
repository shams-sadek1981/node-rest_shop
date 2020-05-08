const mongoose = require('mongoose');

const evaluationMarkSchema = mongoose.Schema({
    startDate: Date,
    endDate: Date,
    evaluationName: {
        type: String,
        required: true
    },
    users: [{
        userName: String,
        designation: String,
        
        learningCurve: Number,
        personalityCurve: Number,
        personalityCurve: Number,
        performanceCurve: Number,
        totalAchievePoint: Number,
        badge: String,

        meatupDeadline: Number,
        qualityOfWork: Number,
        extraResponsibility: Number,
        innovativeContribution: Number,
        customerHappiness: Number,
        preservingData: Number,
        productivity: Number,
        organizationBehavior: Number,
        standupAttendance: Number,
        avgWorkingHour: Number,
        helpsColleague: Number,
        communityEngagement: Number,
        knowledgeSharing: Number,
        domainKnowledge: Number,
        domainKnowledge: Number,
    }],
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('evaluationMark', evaluationMarkSchema);