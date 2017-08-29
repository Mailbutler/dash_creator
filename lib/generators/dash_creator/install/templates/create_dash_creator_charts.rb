class CreateDashCreatorCharts < ActiveRecord::Migration[5.1]
  def change
    if extension_enabled?('pgcrypto') && DashCreator.use_pgcrypto
      create_table :dash_creator_charts, id: :uuid, default: 'gen_random_uuid()' do |t|
        t.string :name
        t.jsonb :data
        t.uuid :user_id

        t.timestamps
      end
    else
      create_table :dash_creator_charts do |t|
        t.string :name
        t.jsonb :data
        t.id :user_id

        t.timestamps
      end
    end
  end

  def self.down
    drop_table :dash_creator_charts
  end
end
