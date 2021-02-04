const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Gerne = require('./models/Gerne')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const movies = [
		Movie.upsert({ name: 'Tea', gerne: 'test', plattform: 'hey' }),
		Movie.upsert({ name: 'Tea1', gerne: 'test2', plattform: 'hey' }),
		Movie.upsert({ name: 'Tea2', gerne: 'test1', plattform: 'hey' }),
		Movie.upsert({ name: 'Tea3', gerne: 'test5', plattform: 'hey' }),
	];
	const gernes = [
		Gerne.upsert({ name: 'Action', gerne: '0x12312' }),
		Gerne.upsert({ name: 'TEst', gerne: '0x32212' }),
	];
	await Promise.all(movies);
	await Promise.all(gernes);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);