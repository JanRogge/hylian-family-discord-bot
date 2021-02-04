require('dotenv').config();
const Sequelize = require('sequelize');

console.log(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Genre = require('./models/Genre')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const movies = [
		Movie.upsert({ name: 'Tea', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Tea1', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Tea2', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Tea3', genre_id: 2, platform: 'hey' }),
	];
	const genres = [
		Genre.upsert({ name: 'Action', color: '0x12312' }),
		Genre.upsert({ name: 'TEst', color: '0x32212' }),
	];
	await Promise.all(movies);
	await Promise.all(genres);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);