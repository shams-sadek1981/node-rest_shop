const express = require('express');
const mongoose = require('mongoose');

exports.getAll = (req, res, next) => {
    res.status(200).json({
        message: 'Shams Sadek'
    })
}
